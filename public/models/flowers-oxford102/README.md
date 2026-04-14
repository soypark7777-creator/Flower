Place the fine-tuned TensorFlow.js flower checkpoint files here.

Expected files:

- `model.json`
- `group1-shard*.bin`
- `metadata.json`

The frontend automatically prefers this checkpoint over the MobileNet fallback when these files exist.
