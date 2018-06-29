"d:\Program Files\Git\bin\bash.exe" -c "find src tests -name '*.js' ! -type d -exec bash -c 'expand -t 4 \"$0\" > /tmp/e && mv /tmp/e \"$0\"' {} \;"
node_modules\.bin\eslint --fix src tests
