import type { NormalUploadProps } from '../NormalUpload'
import NormalUpload from '../NormalUpload'

export default function ImageUpload(
  props: Omit<NormalUploadProps, 'acceptSuffix' | 'listType'>,
) {
  return (
    <NormalUpload
      {...props}
      acceptSuffix={['.png', '.jpg', '.jpeg', '.webp', '.gif']}
      listType="picture-card"
      label="选择图片"
    />
  )
}
