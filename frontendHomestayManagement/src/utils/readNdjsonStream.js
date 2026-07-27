export async function readNdjsonStream(response, onEvent) {
  if (!response.body) {
    throw new Error('Trình duyệt không hỗ trợ đọc phản hồi dạng stream.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed) onEvent(JSON.parse(trimmed))
    }
  }

  buffer += decoder.decode()
  if (buffer.trim()) onEvent(JSON.parse(buffer.trim()))
}
