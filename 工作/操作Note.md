
# 渠道包配置流程

## 1. 生成渠道配置
命令: yarn run generate conf_src_dir channel_id
例如: yarn run generate E:\y77game-base\packages\apk-compiler\apkconfs\14007 14008

## 2. 修改渠道配置
找到新生成的渠道配置文件config.json (google / share)
修改google包名、Adjust应用识别码(adjust_app_token)
PS: 一般只需要修改google渠道的包名，Adjust应用识别码google和share渠道是一样的，都需要修改

## 3. 编译渠道包
打开NativeTool工具，编译前需要先构建、编译好项目，然后选择对应的渠道配置后，点击替换(最好多点几次)，
然后编译生成渠道包

## 4. 检查配置和渠道包
检查渠道配置文件config.json (google / share)是否正确
检查渠道包项目文件的包名，Adjust应用识别码是否正确 (Adjust识别码一般在MainActivity.java文件)

## 5. 拷贝到共享项目
拷贝渠道包到共享项目“A安装包“，选择对应的项目和版本文件夹，并周知他人



# 工具使用

## 工具QuickQ   用户名：meinvchen9@gmail.com/kakaleung352@gmail.com  密码：Zshd181838