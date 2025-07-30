import os
from openai import OpenAI

client = OpenAI(
    base_url="https://router.huggingface.co/v1",
    api_key='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',
)

completion = client.chat.completions.create(
    model="Qwen/Qwen3-Coder-480B-A35B-Instruct:novita",
    messages=[
        {
            "role": "user",
            "content": "What is AI and ML?"
        }
    ],
)

print(completion.choices[0].message.content)