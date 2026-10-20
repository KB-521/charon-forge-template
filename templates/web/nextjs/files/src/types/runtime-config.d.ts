/** docker-config 中的配置会完整公开给浏览器，所有值均为字符串。 */
export interface RuntimeConfig {
  readonly ENV: 'DEV' | 'PROD'
  readonly BASE_URL: string
  readonly [key: string]: string
}

declare global {
  interface Window {
    readonly CONFIG?: RuntimeConfig
  }
}
