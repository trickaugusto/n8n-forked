import express from 'express';
import { LoggerProxy } from 'n8n-workflow';

import { getLogger } from '@/Logger';
import * as ResponseHelper from '@/ResponseHelper';
import type { VariablesRequest } from '@/requests';
import { VariablesService } from './variables.service';
import { EEVariablesController } from './variables.controller.ee';
import Container from 'typedi';
import { EEVariablesService, VariablesValidationError } from './variables.service.ee';

export const variablesController = express.Router();

variablesController.use('/', EEVariablesController);

/**
 * Initialize Logger if needed
 */
variablesController.use((req, res, next) => {
	try {
		LoggerProxy.getInstance();
	} catch (error) {
		LoggerProxy.init(getLogger());
	}
	next();
});

variablesController.use(EEVariablesController);

variablesController.get(
	'/',
	ResponseHelper.send(async () => {
		return Container.get(VariablesService).getAllCached();
	}),
);

variablesController.post(
/*	'/',
	ResponseHelper.send(async () => {
		throw new ResponseHelper.BadRequestError('No variables license found');
	}), */
	'/',
	ResponseHelper.send(async (req: VariablesRequest.Create) => {
		if (req.user.globalRole.name !== 'owner') {
			LoggerProxy.info('Attempt to update a variable blocked due to lack of permissions', {
				userId: req.user.id,
			});
			throw new ResponseHelper.AuthError('Unauthorized');
		}
		
		const variable = req.body;
		delete variable.id;
		try {
			return await Container.get(EEVariablesService).create(variable);
		} catch (error) {
			/* if (error instanceof VariablesLicenseError) {
				throw new ResponseHelper.BadRequestError(error.message);
			} else*/ if (error instanceof VariablesValidationError) {
				throw new ResponseHelper.BadRequestError(error.message);
			} 
			throw error;
		}
	}),
);

variablesController.get(
	'/:id(\\w+)',
	ResponseHelper.send(async (req: VariablesRequest.Get) => {
		const id = req.params.id;
		const variable = await Container.get(VariablesService).getCached(id);
		if (variable === null) {
			throw new ResponseHelper.NotFoundError(`Variable with id ${req.params.id} not found`);
		}
		return variable;
	}),
);

variablesController.patch(
	'/:id(\\w+)',
	/* ResponseHelper.send(async () => {
		throw new ResponseHelper.BadRequestError('No variables license found');
	}), */
	ResponseHelper.send(async (req: VariablesRequest.Update) => {
		const id = req.params.id;
		if (req.user.globalRole.name !== 'owner') {
			LoggerProxy.info('Attempt to update a variable blocked due to lack of permissions', {
				id,
				userId: req.user.id,
			});
			throw new ResponseHelper.AuthError('Unauthorized');
		}
		const variable = req.body;
		delete variable.id;
		try {
			return await Container.get(EEVariablesService).update(id, variable);
		} catch (error) {
			/* if (error instanceof VariablesLicenseError) {
				throw new ResponseHelper.BadRequestError(error.message);
			} else */if (error instanceof VariablesValidationError) {
				throw new ResponseHelper.BadRequestError(error.message);
			} 
			throw error;
		}
	}),
);

variablesController.delete(
	'/:id(\\w+)',
	ResponseHelper.send(async (req: VariablesRequest.Delete) => {
		const id = req.params.id;
		if (req.user.globalRole.name !== 'owner') {
			LoggerProxy.info('Attempt to delete a variable blocked due to lack of permissions', {
				id,
				userId: req.user.id,
			});
			throw new ResponseHelper.AuthError('Unauthorized');
		}
		await Container.get(VariablesService).delete(id);

		return true;
	}),
);
