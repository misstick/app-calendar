Lazyload Grid Component
======

First of all, install React env. :
```
npm install -g react-tools
npm install -g browserify

npm install underscore
npm install react
```

Then translate JSX into JS: 
```
jsx --watch src/ build/
browserify src/base.js -o build/all.js
```

