exports.createCategory = async (req, res) => {
  try {
    const uniqueFields = Array.from(new Set(req.body.fields));
    const category = new CategoryModel({
      name: req.body.name,
      fields: uniqueFields
    });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};