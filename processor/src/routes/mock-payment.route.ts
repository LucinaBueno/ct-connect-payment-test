import { SessionHeaderAuthenticationHook } from '@commercetools/connect-payments-sdk';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  PaymentRequestSchema,
  PaymentRequestSchemaDTO,
  PaymentResponseSchema,
  PaymentResponseSchemaDTO,
  StripeWebhookPayloadDTO,
  StripeWebhookPayloadSchema,
} from '../dtos/mock-payment.dto';
import { MockPaymentService } from '../services/mock-payment.service';
import { log } from '../libs/logger/index';

type PaymentRoutesOptions = {
  paymentService: MockPaymentService;
  sessionHeaderAuthHook: SessionHeaderAuthenticationHook;
};

export const paymentRoutes = async (fastify: FastifyInstance, opts: FastifyPluginOptions & PaymentRoutesOptions) => {
  fastify.post<{ Body: PaymentRequestSchemaDTO; Reply: PaymentResponseSchemaDTO }>(
    '/payments',
    {
      preHandler: [opts.sessionHeaderAuthHook.authenticate()],
      schema: {
        body: PaymentRequestSchema,
        response: {
          200: PaymentResponseSchema,
        },
      },
    },
    async (request, reply) => {
      log.info('------>>>> mock-payment.route.ts /payments: body: ' + JSON.stringify(request.body));
      const resp = await opts.paymentService.createPayment({
        data: request.body,
      });

      return reply.status(200).send(resp);
    },
  );
};

export const stripeWebhooksRoutes = async (
  fastify: FastifyInstance,
  //opts: FastifyPluginOptions & PaymentRoutesOptions,
) => {
  fastify.post<{ Body: StripeWebhookPayloadDTO; Reply: any }>(
    '/stripe/webhooks',
    {
      schema: {
        body: StripeWebhookPayloadSchema,
      },
    },
    async (request, reply) => {
      log.info('------>>>> mock-payment.route.ts /stripe/webhooks: body: ' + JSON.stringify(request.body));

      switch (request.body.type) {
        case 'payment_intent.payment_failed':
          // define information to save in ct
          log.info('--->>> payment_intent.payment_failed');
          break;
        case 'payment_intent.processing':
          // define information to save in ct
          log.info('--->>> payment_intent.processing');
          break;
        case 'payment_intent.succeeded':
          // define information to save in ct
          log.info('--->>> payment_intent.succeeded');
          break;
        default:
          // This event is not supported
          log.info('--->>> This event is not supported: ' + request.body.type);
          break;
      }

      return reply.status(200).send();
    },
  );
};
