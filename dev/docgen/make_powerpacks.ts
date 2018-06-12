import * as ts from "typescript"
import * as path from "path"
import * as glob from "glob"
import { program } from "./base"
import { commentsToText, makeLink, getComponentURL, makeComponentLink } from "./genUtils"
import { getNamedDeclarations } from "./tsUtil";
import { getLineNo } from "./strUtil";

export function* make(): IterableIterator<string> {
  yield "# PowerPacks"
  yield ""
  yield `**Usage**: Before initializing a editor, \`import "hypermd/powerpack/some-powerpack-name"\``
  yield ""
  yield "Note that PowerPack scripts will require the related third-party libraries, and (potentially) update some addon's default options."
  yield ""
  yield "In plain browser env, PowerPack-provided components are stored in `window.HyperMD_PowerPack['some-powerpack-name']`"
  yield ""
  yield "> This document is generated by *dev/docgen/make_powerpacks.ts* from source files."
  yield "> If you want to update this doc, edit corresponded source code."

  const fileList = glob.sync("src/powerpack/**/*.ts")
  for (const filename of fileList) {
    if (/\.d\.ts$/.test(filename)) continue
    const name = path.basename(filename, ".ts")
    const normalizedName = filename.slice(4, -3) // "powerpack/foobar"
    var sf = program.getSourceFile(filename)

    yield ""
    yield "## " + name
    yield ""

    var imports: ts.NodeArray<ts.StringLiteral> = (sf as any).imports
    var tp_libs = new Set<string>() // {"katex"}
    var targets = new Set<string>() // ["addon/fold-math"]
    for (const node of imports) {
      var text = node.text
      if (text[0] != ".") tp_libs.add(/^[^/]+/.exec(text)[0])
      else {
        let cleanName = path.normalize(path.join(path.dirname(filename.slice(4)), text))
          .replace(/\\/g, '/')
          .replace(/^\.\//, '')
        targets.add(cleanName)
      }
    }


    let tp_libs_str = ""
    for (const lib of tp_libs.values()) {
      tp_libs_str += "  " + makeLink(lib, 'https://www.npmjs.com/package/' + lib)
    }
    yield "📦 **Third-Party Libs**: " + tp_libs_str
    yield ""


    let targets_str = ""
    for (const lib of targets.values()) {
      targets_str += "  " + makeLink(lib, getComponentURL(lib))
    }
    yield "🚀 **Related Components**: " + targets_str
    yield ""


    let exported = getNamedDeclarations(sf)
    let exported_str = [] as string[]
    exported.forEach((v, k) => {
      if (v.length != 1) return
      var node = v[0]

      exported_str.push("* " + makeLink(k, getComponentURL(normalizedName, "#L" + getLineNo(sf.text, node.getStart(sf)))))
    })

    if (exported_str.length) {
      yield "🚢 **Provides**:"
      yield ""
      yield exported_str.join("\n")
      yield ""
    }

    // get leading comments
    yield commentsToText(ts.getLeadingCommentRanges(sf.text, 0), sf).trimRight().replace(/^/gm, '> ')
    yield ""
    yield ""
  }
}

if (require.main === module) {
  for (const line of make()) {
    console.log(line)
  }
}
