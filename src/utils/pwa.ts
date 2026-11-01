export function getPwaIconUrl(source: string | null | undefined, size: number) {
  const image = source || '';
  const cloudinaryUploadPath = '/image/upload/';

  if (image.includes('res.cloudinary.com') && image.includes(cloudinaryUploadPath)) {
    return image.replace(
      cloudinaryUploadPath,
      `${cloudinaryUploadPath}c_pad,w_${size},h_${size},b_black,f_png/`,
    );
  }

  return image;
}
