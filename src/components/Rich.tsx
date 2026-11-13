import katex from 'katex'
import { Fragment, useMemo } from 'react'
import type { Block } from '../types'

export function Tex({ tex, block = false }: { tex: string; block?: boolean }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, { displayMode: block, throwOnError: false, output: 'html' })
    } catch {
      return tex
    }
  }, [tex, block])
  return block ? <div className="tex-block" dangerouslySetInnerHTML={{ __html: html }} /> : <span dangerouslySetInnerHTML={{ __html: html }} />
}

/** Texte enrichi : **gras**, *italique*, `code`, $formule$ */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\$[^$]+\$|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return (
    <>
      {parts.map((s, i) => {
        if (!s) return null
        if (s.startsWith('$') && s.endsWith('$') && s.length > 2) return <Tex key={i} tex={s.slice(1, -1)} />
        if (s.startsWith('**')) return <strong key={i}>{s.slice(2, -2)}</strong>
        if (s.startsWith('*') && s.length > 2) return <em key={i}>{s.slice(1, -1)}</em>
        if (s.startsWith('`')) return <code key={i}>{s.slice(1, -1)}</code>
        return <Fragment key={i}>{s}</Fragment>
      })}
    </>
  )
}

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="blocks">
      {blocks.map((b, i) => {
        switch (b.t) {
          case 'h':
            return <h3 key={i}>{b.text}</h3>
          case 'p':
            return (
              <p key={i}>
                <Rich text={b.text} />
              </p>
            )
          case 'list': {
            const L = b.ordered ? 'ol' : 'ul'
            return (
              <L key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Rich text={it} />
                  </li>
                ))}
              </L>
            )
          }
          case 'formula':
            return (
              <figure key={i} className="formula">
                {b.label && <figcaption>{b.label}</figcaption>}
                <Tex tex={b.tex} block />
                {b.note && (
                  <p className="muted small">
                    <Rich text={b.note} />
                  </p>
                )}
              </figure>
            )
          case 'tip':
            return (
              <aside key={i} className="callout tip">
                <b>À retenir</b>
                <p>
                  <Rich text={b.text} />
                </p>
              </aside>
            )
          case 'trap':
            return (
              <aside key={i} className="callout trap">
                <b>Piège d’examen</b>
                <p>
                  <Rich text={b.text} />
                </p>
              </aside>
            )
          case 'fr':
            return (
              <aside key={i} className="callout fr">
                <b>En français</b>
                <p>
                  <Rich text={b.text} />
                </p>
              </aside>
            )
          case 'example':
            return (
              <aside key={i} className="callout example">
                <b>{b.title ?? 'Exemple'}</b>
                {b.lines.map((l, j) => (
                  <p key={j}>
                    <Rich text={l} />
                  </p>
                ))}
              </aside>
            )
          case 'table':
            return (
              <div key={i} className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      {b.head.map((h, j) => (
                        <th key={j}>
                          <Rich text={h} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j}>
                        {r.map((c, k) => (
                          <td key={k}>
                            <Rich text={c} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        }
      })}
    </div>
  )
}
