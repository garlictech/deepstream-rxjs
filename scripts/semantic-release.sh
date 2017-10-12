#!/usr/bin/env bash
if [ "$TRAVIS_EVENT_TYPE" == "pull_request" ]; then  
  echo "Not published in pull request."
else
  semantic-release pre

  if [ $? -eq 0 ]; then
    npm publish --access public && semantic-release post
  else
    exit 0
  fi
fi
