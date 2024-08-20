## Alpine Linux

Alpine is not using glibc as default library so you need to other precompiled components:

[Alpine x86_64 3.7.0](https://github.com/DEgITx/rats-search/files/1972698/alpine_x64_searchd.tar.gz) - replace in "imports/linux/x64"

## CentOS 6

CentOS 6 is using old glibc, you need atleast 2.7 to start precompiled components.

Start as root to update glibc to 2.7:
```console
wget https://gist.githubusercontent.com/harv/f86690fcad94f655906ee9e37c85b174/raw/2cfcc7922b0c2f391afb957fd209a1f1f2f9f659/glibc-2.17_centos6.sh && chmod +x glibc-2.17_centos6.sh && ./glibc-2.17_centos6.sh
```

## Arch linux

sphinx requires openssl-1.1 which is not installed by default on minimal arch installs

```console
pacman -S openssl-1.1
```
