const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get settings
exports.getSettings = async (req, res) => {
  try {
    const defaultSettings = [
      { key: 'msg_rate', value: '400', description: 'Rate per pesan' },
      { key: 'referral_commission', value: '50', description: 'Kode komisi' },
      { key: 'min_withdraw', value: '10000', description: 'Min withdraw' },
      { key: 'global_message_template', value: 'Halo, ini pesan dari sistem.', description: 'Pesan Blast Template' },
      { key: 'antiban_daily_limit', value: '200', description: 'Batas kirim per device / hari' },
      { key: 'antiban_batch_size', value: '50', description: 'Batas pesan per batch warm-up' },
      { key: 'antiban_batch_delay', value: '5', description: 'Jeda per batch (menit)' },
      { key: 'antiban_failure_limit', value: '20', description: 'Limit threshold gagal stop (%)' }
    ];

    let settings = await prisma.systemSetting.findMany();
    
    // Ensure defaults exist
    if (settings.length === 0) {
      for (const def of defaultSettings) {
        await prisma.systemSetting.create({ data: def });
      }
      settings = await prisma.systemSetting.findMany();
    }

    const settingsObj = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settings', error: error.message });
  }
};

// Update settings
exports.updateSettings = async (req, res) => {
  const { 
    msg_rate, referral_commission, min_withdraw, global_message_template,
    antiban_daily_limit, antiban_batch_size, antiban_batch_delay, antiban_failure_limit
  } = req.body;
  
  try {
    const updates = [];
    if (msg_rate !== undefined) updates.push({ key: 'msg_rate', value: String(msg_rate) });
    if (referral_commission !== undefined) updates.push({ key: 'referral_commission', value: String(referral_commission) });
    if (min_withdraw !== undefined) updates.push({ key: 'min_withdraw', value: String(min_withdraw) });
    if (global_message_template !== undefined) updates.push({ key: 'global_message_template', value: String(global_message_template) });
    if (antiban_daily_limit !== undefined) updates.push({ key: 'antiban_daily_limit', value: String(antiban_daily_limit) });
    if (antiban_batch_size !== undefined) updates.push({ key: 'antiban_batch_size', value: String(antiban_batch_size) });
    if (antiban_batch_delay !== undefined) updates.push({ key: 'antiban_batch_delay', value: String(antiban_batch_delay) });
    if (antiban_failure_limit !== undefined) updates.push({ key: 'antiban_failure_limit', value: String(antiban_failure_limit) });

    for (const update of updates) {
      await prisma.systemSetting.upsert({
        where: { key: update.key },
        update: { value: update.value },
        create: { key: update.key, value: update.value, description: update.key }
      });
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating settings', error: error.message });
  }
};

// Update Template (Image, Caption, Targets)
exports.updateTemplate = async (req, res) => {
  const { caption, removeImage, global_target_numbers } = req.body;
  
  try {
    if (caption !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: 'global_message_template' },
        update: { value: String(caption) },
        create: { key: 'global_message_template', value: String(caption), description: 'Pesan Blast Template' }
      });
    }

    if (global_target_numbers !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: 'global_target_numbers' },
        update: { value: String(global_target_numbers) },
        create: { key: 'global_target_numbers', value: String(global_target_numbers), description: 'Daftar Nomor Target Global' }
      });
    }

    if (req.file) {
      const imageUrl = '/uploads/' + req.file.filename;
      await prisma.systemSetting.upsert({
        where: { key: 'global_image_url' },
        update: { value: imageUrl },
        create: { key: 'global_image_url', value: imageUrl, description: 'Image Cover untuk Blast Template' }
      });
    } else if (removeImage === 'true') {
      await prisma.systemSetting.upsert({
        where: { key: 'global_image_url' },
        update: { value: '' },
        create: { key: 'global_image_url', value: '', description: 'Image Cover untuk Blast Template' }
      });
    }

    res.json({ message: 'Template successfully updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating template', error: error.message });
  }
};
