<script lang="ts" setup>
import { useUIStore } from '@/stores/ui.store';
import { useI18n, useMessage, useToast } from '@/composables';
import { useExternalSecretsStore } from '@/stores';
import { computed, onMounted } from 'vue';
import ExternalSecretsProviderCard from '@/components/ExternalSecretsProviderCard.ee.vue';
import type { ExternalSecretsProvider } from '@/Interface';

const i18n = useI18n();
const uiStore = useUIStore();
const externalSecretsStore = useExternalSecretsStore();
const message = useMessage();
const toast = useToast();

const sortedProviders = computed(() => {
	return ([...externalSecretsStore.providers] as ExternalSecretsProvider[]).sort((a, b) => {
		return b.name.localeCompare(a.name);
	});
});

onMounted(() => {
	try {
		void externalSecretsStore.fetchAllSecrets();
		void externalSecretsStore.getProviders();
	} catch (error) {
		toast.showError(error, i18n.baseText('error'));
	}
});

function goToUpgrade() {
	uiStore.goToUpgrade('external-secrets', 'upgrade-external-secrets');
}
</script>

<template>
	<div class="pb-3xl">
		<n8n-heading size="2xlarge">{{ i18n.baseText('settings.externalSecrets.title') }}</n8n-heading>
		<div
			v-if="externalSecretsStore.isEnterpriseExternalSecretsEnabled || true"
			data-test-id="external-secrets-content-licensed"
		>
			<n8n-callout theme="secondary" class="mt-2xl mb-l">
				{{ i18n.baseText('settings.externalSecrets.info') }}
				<a :href="i18n.baseText('settings.externalSecrets.docs')" target="_blank">
					{{ i18n.baseText('settings.externalSecrets.info.link') }}
				</a>
			</n8n-callout>
			<ExternalSecretsProviderCard
				v-for="provider in sortedProviders"
				:key="provider.name"
				:provider="provider"
			/>
		</div>
		<n8n-action-box
			v-else
			class="mt-2xl mb-l"
			data-test-id="external-secrets-content-unlicensed"
			:buttonText="i18n.baseText('settings.externalSecrets.actionBox.buttonText')"
			@click="goToUpgrade"
		>
			<template #heading>
				<span>{{ i18n.baseText('settings.externalSecrets.actionBox.title') }}</span>
			</template>
			<template #description>
				<i18n-t keypath="settings.externalSecrets.actionBox.description">
					<template #link>
						<a :href="i18n.baseText('settings.externalSecrets.docs')" target="_blank">
							{{ i18n.baseText('settings.externalSecrets.actionBox.description.link') }}
						</a>
					</template>
				</i18n-t>
			</template>
		</n8n-action-box>
	</div>
</template>
