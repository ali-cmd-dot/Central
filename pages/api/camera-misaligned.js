import { getCameraMisalignedData } from '../../lib/sheets';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const data = await getCameraMisalignedData();
    res.status(200).json(data);
  } catch (error) {
    console.error('Camera API Error:', error);
    res.status(500).json({
      success: false,
      error: error.toString()
    });
  }
}
