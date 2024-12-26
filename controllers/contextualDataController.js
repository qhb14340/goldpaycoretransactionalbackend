const { createContextualData, getContextualDataById } = require('../models/contextualData');

const createContextualDataHandler = async (req, res) => {
  try {
    const { ref_id, type, content } = req.body;
    if (!ref_id || !type || !content) {
      return res.status(400).json({ status: 'failed', error: 'Missing required fields' });
    }
    const data = await createContextualData(ref_id, type, content);
    res.json({ status: 'success', data });
  } catch (error) {
    res.status(400).json({ status: 'failed', error: error.message });
  }
};

const getContextualDataHandler = async (req, res) => {
  try {
    const { refId } = req.params;
    const data = await getContextualDataById(refId);
    if (data.length === 0) {
      return res.status(404).json({ status: 'failed', error: 'No contextual data found for this reference ID' });
    }
    res.json({ status: 'success', data });
  } catch (error) {
    res.status(400).json({ status: 'failed', error: error.message });
  }
};

module.exports = { createContextualDataHandler, getContextualDataHandler };