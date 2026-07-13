import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'

export default function PostBody({ markdown }: { markdown: string }) {
  return (
    <div
      className="space-y-4 leading-relaxed text-color
        [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-color
        [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-color
        [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-color
        [&_a]:text-primary [&_a]:underline
        [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6
        [&_code]:rounded [&_code]:bg-surface-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm dark:[&_code]:bg-surface-800
        [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-surface-100 [&_pre]:p-4 dark:[&_pre]:bg-surface-800
        [&_pre_code]:bg-transparent [&_pre_code]:p-0
        [&_blockquote]:border-l-2 [&_blockquote]:border-surface [&_blockquote]:pl-4 [&_blockquote]:text-muted-color
        [&_img]:rounded-lg"
    >
      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{markdown}</ReactMarkdown>
    </div>
  )
}
