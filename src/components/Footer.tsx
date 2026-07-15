import GithubIcon from './icons/GithubIcon'

export default function Footer() {
  return (
    <footer className="border-t border-surface">
      <div className="mx-auto grid max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-3 xl:max-w-7xl xl:px-8 2xl:max-w-[1800px] 2xl:px-12">
        <span aria-hidden="true" />
        <p className="justify-self-center text-xs text-muted-color">
          Made with ❤️ in Yokohama
        </p>
        <a
          href="https://github.com/alyralabs/digitaletude"
          target="_blank"
          rel="noreferrer"
          aria-label="View this site's source on GitHub"
          className="justify-self-end text-muted-color transition-colors hover:text-color focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <GithubIcon className="size-5" />
        </a>
      </div>
    </footer>
  )
}
