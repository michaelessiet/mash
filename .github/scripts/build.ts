#!/usr/bin/env -S pkgx deno run --allow-read --allow-write

import * as flags from "https://deno.land/std@0.206.0/flags/mod.ts";
import { Path } from "https://deno.land/x/libpkgx@v0.16.0/mod.ts";
import { Script } from "./index.ts";

const args = flags.parse(Deno.args);
const indir = (s => Path.abs(s) ?? Path.cwd().join(s))(args['input'])
const outdir = (s => Path.abs(s) ?? Path.cwd().join(s))(args['output'])
const index_json_path = args['index-json']

if (!indir || !outdir || !index_json_path) {
  console.error(`usage: build.ts --input <path> --output <path> --index-json <path>`);
  Deno.exit(64);
}

const scripts = JSON.parse(Deno.readTextFileSync(index_json_path)).scripts as Script[]

const categories: Record<string, Script[]> = {}
const users: Record<string, Script[]> = {}

for (const script of scripts) {
  if (script.category) {
    categories[script.category] ??= []
    categories[script.category].push(script)
  }
  const user = script.fullname.split('/')[0]
  users[user] ??= []
  users[user].push(script)
}

// sort each entry in categories and users by the script birthtime
for (const scripts of Object.values(categories)) {
  scripts.sort((a, b) => new Date(b.birthtime).getTime() - new Date(a.birthtime).getTime());
}
for (const scripts of Object.values(users)) {
  scripts.sort((a, b) => new Date(b.birthtime).getTime() - new Date(a.birthtime).getTime());
}

for (const category in categories) {
  const d = outdir.join(category)
  const scripts = categories[category].filter(({description}) => description)
  d.mkdir('p').join('index.json').write({ json: { scripts }, force: true, space: 2 })
}

for (const user in users) {
  const d = outdir.join('u', user)
  const scripts = users[user].filter(({description}) => description)
  d.mkdir('p').join('index.json').write({ json: { scripts }, force: true, space: 2 })
}

for (const script of scripts) {
  console.error(script)
  const [user, name] = script.fullname.split('/')
  const { category } = script
  const gh_slug = new URL(script.url).pathname.split('/').slice(1, 3).join('/')
  const infile = indir.join(gh_slug, 'scripts', name)

  infile.cp({ into: outdir.join('u', user).mkdir('p') })

  const leaf = infile.basename().split('-').slice(1).join('-')
  if (category && !outdir.join(category, leaf).exists()) { // not already snagged
    infile.cp({ to: outdir.join(category, leaf) })
  }
}

outdir.join('u/index.json').write({ json: { users }, force: true, space: 2})
