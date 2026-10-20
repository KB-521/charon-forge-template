import { ConfigService } from '@nestjs/config';

export interface OssYamlConfig {
  enabled: boolean;
  endpoint: string;
  bucketName: string;
  allowedBucketNames: readonly string[];
  accessKeyId: string;
  accessKeySecret: string;
  jasyptPassword?: string;
  region?: string;
  stsToken?: string;
}

function read(
  config: ConfigService,
  key: string,
  required: boolean,
  trim = true,
): string | undefined {
  const raw = config.get<string>(key);
  const value = trim ? raw?.trim() : raw;
  if (required && !value) throw new Error(`${key} is required`);
  return value || undefined;
}

export function loadOssConfig(config: ConfigService): OssYamlConfig {
  const enabled = read(config, 'OSS_ENABLED', false) ?? 'false';
  if (!['true', 'false'].includes(enabled)) throw new Error('OSS_ENABLED must be true or false');
  if (enabled === 'false') {
    return {
      enabled: false,
      endpoint: '',
      bucketName: '',
      allowedBucketNames: [],
      accessKeyId: '',
      accessKeySecret: '',
    };
  }
  const bucketName = read(config, 'OSS_BUCKET_NAME', true)!;
  const allowedBucketNames = (read(config, 'OSS_ALLOWED_BUCKET_NAMES', false) ?? bucketName)
    .split(',')
    .map((value) => value.trim())
    .filter((value, index, values) => value && values.indexOf(value) === index);
  return {
    enabled: true,
    endpoint: read(config, 'OSS_ENDPOINT', true)!,
    bucketName,
    allowedBucketNames,
    accessKeyId: read(config, 'OSS_ACCESS_KEY_ID', true, false)!,
    accessKeySecret: read(config, 'OSS_ACCESS_KEY_SECRET', true, false)!,
    jasyptPassword: read(config, 'JASYPT_PASSWORD', false, false),
    region: read(config, 'OSS_REGION', false),
    stsToken: read(config, 'OSS_STS_TOKEN', false, false),
  };
}
