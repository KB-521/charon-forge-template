import OSS = require('ali-oss');
import { decryptIfEncrypted } from '../config/jasypt-decryptor';
import type { OssYamlConfig } from './oss.config';

function endpoint(value: string): string {
  return value.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

export function createOssClient(config: OssYamlConfig): OSS {
  if (!config.enabled)
    throw new Error('OSS is disabled; set OSS_ENABLED=true and provide OSS configuration');
  const region = config.region ?? endpoint(config.endpoint).split('.')[0];
  if (!region?.startsWith('oss-'))
    throw new Error('OSS_REGION is required when it cannot be derived from OSS_ENDPOINT');
  return new OSS({
    region,
    endpoint: endpoint(config.endpoint),
    bucket: config.bucketName,
    accessKeyId: decryptIfEncrypted(config.accessKeyId, config.jasyptPassword),
    accessKeySecret: decryptIfEncrypted(config.accessKeySecret, config.jasyptPassword),
    stsToken:
      config.stsToken === undefined
        ? undefined
        : decryptIfEncrypted(config.stsToken, config.jasyptPassword),
    secure: true,
  });
}

export function createLazyOssClient(config: OssYamlConfig): OSS {
  let client: OSS | undefined;
  const getClient = (): OSS => (client ??= createOssClient(config));
  return new Proxy({} as OSS, {
    get: (_target, property) => {
      // Nest inspects provider lifecycle hooks and thenables before the client is used.
      if (
        typeof property !== 'string' ||
        property === 'then' ||
        property.startsWith('onModule') ||
        property.startsWith('onApplication') ||
        property === 'beforeApplicationShutdown'
      )
        return undefined;
      const value = Reflect.get(getClient(), property);
      return typeof value === 'function' ? value.bind(getClient()) : value;
    },
  });
}
