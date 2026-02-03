import { Anthropic } from '@anthropic-ai/sdk';
import path from 'path';

const OUTPUT_START_MARKER = '---NANOCLAW_OUTPUT_START---';
const OUTPUT_END_MARKER = '---NANOCLAW_OUTPUT_END---';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Read input from stdin
let inputData = '';
process.stdin.on('data', (chunk) => {
  inputData += chunk.toString();
});
process.stdin.on('end', async () => {
  try {
    const input = JSON.parse(inputData);
    const { prompt, groupFolder } = input;

    // Set cwd to group folder
    const groupDir = path.resolve(process.cwd(), '..', 'groups', groupFolder);
    process.chdir(groupDir);

    // Simple Claude call - expand for full Agent SDK if needed
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
      system: 'You are a personal assistant. Respond concisely.',
    });

    const textBlock = message.content.find(block => block.type === 'text');
    const result = textBlock && 'text' in textBlock ? textBlock.text : null;

    const output = {
      status: 'success',
      result,
    };

    // Output with markers
    process.stdout.write(OUTPUT_START_MARKER + '\n');
    process.stdout.write(JSON.stringify(output) + '\n');
    process.stdout.write(OUTPUT_END_MARKER + '\n');
  } catch (error) {
    const output = {
      status: 'error',
      result: null,
      error: error instanceof Error ? error.message : String(error),
    };
    process.stdout.write(OUTPUT_START_MARKER + '\n');
    process.stdout.write(JSON.stringify(output) + '\n');
    process.stdout.write(OUTPUT_END_MARKER + '\n');
  }
  process.exit(0);
});
