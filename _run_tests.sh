#!/usr/bin/env bash
#
# 全量测试运行器
#
# 为什么要有它：49 个套件以前靠手写 for 循环跑，漏跑一次没人知道。
# 改一行代码没跑测试就提交，守卫全失效 —— 这是最省事也最容易发生的退化。
#
# 用法：./_run_tests.sh        （或 bash _run_tests.sh）
# 退出码：全部通过 0；任一套件失败 1（可直接当 pre-commit 用）
#
# 跳过 _test/_smoke_env.js：下划线前缀是公共环境，不是套件。

set -uo pipefail
cd "$(dirname "$0")"

suites=()
for f in _test/*.js; do
  [ -e "$f" ] || continue
  case "$(basename "$f")" in _*) continue ;; esac
  suites+=("$f")
done

pass=0; fail=0; failed=()
for t in "${suites[@]}"; do
  if out=$(node "$t" 2>&1); then
    pass=$((pass + 1))
  else
    fail=$((fail + 1)); failed+=("$t")
    printf 'FAIL %s\n' "$t"
    printf '%s\n' "$out" | grep -E '✗|Error' | head -8 | sed 's/^/    /'
  fi
done

# 不统计断言总数：各套件输出格式不统一（「通过 N / 失败 M」「N 项，失败 0」「全部通过」
# 三种都有），凑出来的总数会是个看起来权威的错值。宁可少一个数，不给错数。
printf '\n合计：套件 通过 %d / 失败 %d（共 %d 个）\n' \
  "$pass" "$fail" "${#suites[@]}"

if [ "$fail" -gt 0 ]; then
  printf '失败套件：\n'
  printf '  %s\n' "${failed[@]}"
  exit 1
fi
