---
layout: post
title: homebrew-alt で gcc-4.6 をインストール
---

OSX 環境で新しめの gcc をインストールするにはどうすれば良いのだろうか,
と調べたところ, homebrew-alt というレポジトリがあるので, そこから install すると楽だった.

    $ sudo brew install https://github.com/adamv/homebrew-alt/raw/master/duplicates/gcc.rb \
        --enable-cxx --enable-objc --enable-objcxx
    $ sudo ln -sf /usr/local/bin/gcc-4.6 /usr/bin/gcc
    $ sudo ln -sf /usr/local/bin/g++-4.6 /usr/bin/g++

3 月ごろに [adamv/duplicates や adamv/versions が退避](http://twitter.com/#!/machomebrew/status/47884260580921344)してきたものらしい.
versions には代表的なものとして gcc45, python31, python24 などがある.

<!--
{% highlight ruby %}
def foo
  puts 'foo'
end
{% endhighlight %}
-->
