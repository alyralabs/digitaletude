import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import PostBody from './PostBody'

// PostBody renders CMS-authored markdown — the one place arbitrary content
// reaches the DOM. These tests pin the sanitization contract (react-markdown
// skips raw HTML, rehype-sanitize + the default url transform strip the
// rest) so a future renderer/plugin change that weakens it fails loudly.
describe('PostBody sanitization', () => {
  it('renders normal markdown: emphasis, links, and code', () => {
    render(
      <PostBody
        markdown={
          'Some **bold** text, a [link](https://example.com), and `code`.'
        }
      />,
    )

    expect(screen.getByText('bold')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'link' })
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(screen.getByText('code')).toBeInTheDocument()
  })

  it('does not render script tags from raw HTML', () => {
    const { container } = render(
      <PostBody
        markdown={'before\n\n<script>window.pwned = true</script>\n\nafter'}
      />,
    )

    expect(container.querySelector('script')).toBeNull()
    expect(screen.getByText('before')).toBeInTheDocument()
    expect(screen.getByText('after')).toBeInTheDocument()
  })

  it('strips event-handler attributes from raw HTML elements', () => {
    const { container } = render(
      <PostBody
        markdown={'<img src="x.png" onerror="window.pwned = true" />'}
      />,
    )

    const img = container.querySelector('img')
    // whether the img survives or not, the handler must never reach the DOM
    expect(img?.getAttribute('onerror') ?? null).toBeNull()
    expect(container.innerHTML).not.toContain('onerror')
  })

  it('neutralizes javascript: hrefs in markdown links', () => {
    render(<PostBody markdown={'[click me](javascript:alert(1))'} />)

    const link = screen.getByText('click me').closest('a')
    expect(link?.getAttribute('href') ?? '').not.toContain('javascript:')
  })
})
