#!/usr/bin/env sh

is_cdk_code_modified () {
  if (git diff --cached --name-only | grep -E '^bin/' --or -E '^lib/' --or -E '^test/' --or '^package-lock.json'> /dev/null 2>&1); then
    return 0
  else
    return 1
  fi
}
