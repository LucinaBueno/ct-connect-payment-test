import { getConfig } from '../config/config';
import { log } from '../libs/logger/index';

const stripe = require('stripe')(getConfig().stripeSecretKey);

export async function stripeWebhooksSetup(): Promise<void> {
  const processorAppEndpoint = await getProcessorAppEndpoint();

  if (stripe) {
    const webhookEndpoint = await stripe.webhookEndpoints.create({
      enabled_events: ['payment_intent.payment_failed', 'payment_intent.processing', 'payment_intent.succeeded'],
      url: `${processorAppEndpoint}stripe/webhooks`,
    });
    log.info('-----------------------');
    log.info(JSON.stringify(webhookEndpoint));
    log.info('-----------------------');
  }
}

async function getProcessorAppEndpoint() {
  let endpoint = '';

  const deploymentInfo = await getDeploymentByKey();

  const applications = deploymentInfo.applications;

  if (applications && applications.length > 0) {
    const filtered = applications.filter((app: any) => app.applicationName === 'processor');
    endpoint = filtered.length > 0 ? filtered[0].url : '';
  }

  return endpoint;
}

async function getDeploymentByKey() {
  const accessToken = await getAccessToken();
  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };

  return await fetch(
    `${getConfig().connectUrl}/${getConfig().projectKey}/deployments/key=${getConfig().connectDeploymentKey}`,
    {
      method: 'GET',
      headers,
    },
  )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }

      throw new Error(`Status ${response.status}`);
    })
    .then((data) => {
      return data;
    })
    .catch((error) => {
      log.error(`Error at getting deployment information from commercetools`, error);
      throw new Error(error);
    });
}

async function getAccessToken() {
  const credentials = `${getConfig().clientId}:${getConfig().clientSecret}`;
  const basicAuthHeader = `Basic ${Buffer.from(credentials).toString('base64')}`;
  const headers = {
    Accept: 'application/json',
    Authorization: `${basicAuthHeader}`,
  };

  return await fetch(`${getConfig().authUrl}/oauth/token?grant_type=client_credentials&scope=${getConfig().scope}`, {
    method: 'POST',
    headers,
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }

      throw new Error(`Status ${response.status}`);
    })
    .then((data) => {
      return data.access_token;
    })
    .catch((error) => {
      log.error(`Error at getting authentication token from commercetools`, error);
      throw new Error(error);
    });
}
