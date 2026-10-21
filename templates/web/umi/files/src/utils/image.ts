/** 导入图片 */
export function loadImage(image: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()

    img.crossOrigin = 'anonymous'
    img.src = image
    img.onload = () => {
      resolve(img)
    }

    img.onerror = (err) => {
      reject(err)
    }
  })
}
