import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Clear the admin_token cookie
  res.setHeader(
    'Set-Cookie',
    'admin_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  );

  return res.status(200).json({ message: 'Logged out successfully' });
}
