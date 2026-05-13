# CmdDo 📋

> 不用离开终端的待办清单。给不想切窗口的开发者。

```
$ cmddo list

┌────────┬──────┬──────────────┬──────┬────────────┬────┐
│ ID     │ 优先 │ 内容         │ 标签 │ 创建时间   │ 状 │
├────────┼──────┼──────────────┼──────┼────────────┼────┤
│ 342817 │ HIGH │ 修复登录 Bug │ work │ 05-13 09:24 │ ○  │
│ 581203 │ LOW  │ 买菜         │      │ 05-13 08:10 │ ✓  │
│ 764291 │ MED  │ 写单元测试   │ dev  │ 05-12 22:05 │ ○  │
└────────┴──────┴──────────────┴──────┴────────────┴────┘
```

## ⚡ 30 秒上手

```bash
npm install -g cmddo

cmddo add "修复登录 Bug" -p high -t work
cmddo add "写单元测试"
cmddo list
cmddo done 34          # ID 前缀匹配，不用输完整 6 位
```

## 🤔 为什么是 CmdDo

打开浏览器查个待办，顺手刷了 20 分钟手机。CmdDo 让你留在终端里——添加、完成、查看统计，全程不切窗口。

**不是又一个 todo app。** 是给命令行重度用户设计的工具：

- 🔍 **ID 前缀匹配** — `cmddo done 34` 就够了，不用记 `342817`
- 🎨 **彩色表格** — 高优先级红色、已完成删除线，一眼扫完
- 📊 **本周统计** — `cmddo stats` 看完成趋势，ASCII 柱状图
- 🛡️ **原子写入** — tmp + rename，断电不丢数据
- 🎛️ **主题可定制** — `~/.cmddo/config.yaml` 改颜色，改存储路径
- 📤 **导出** — Markdown 或 CSV，输出到终端或文件

## 📖 完整命令

```bash
# 任务管理
cmddo add <内容> [-p high|med|low] [-t 标签]
cmddo list [-s pending|done]
cmddo done <ID>           # 支持前缀匹配
cmddo remove <ID>         # 支持前缀匹配

# 导出
cmddo export [-f markdown|csv] [-o 文件路径]

# 统计
cmddo stats               # 概览 + 本周完成柱状图

# 配置
cmddo config              # 查看当前配置
cmddo config <key> <value>  # 如: cmddo config theme.priority_high blue
```

## ⚙️ 配置

`~/.cmddo/config.yaml`：

```yaml
storage_path: ~/.cmddo/tasks.json
theme:
  priority_high: red
  priority_med: yellow
  priority_low: green
  done: green
  pending: yellow
```

## 🛠️ 本地开发

```bash
git clone https://github.com/YOUR_USERNAME/CmdDo.git
cd CmdDo
npm install
npm test            # 31 个用例
npm link            # 全局可用 cmddo 命令
```

## 📁 项目结构

```
bin/cmddo.js        CLI 入口
src/cli.js           命令定义（Commander）
src/storage.js       JSON 持久化，原子写入，ID 前缀匹配
src/config.js        YAML 配置管理
src/utils.js         时间格式化、颜色映射
tests/               存储层 + CLI 集成测试
```

## 📄 License

MIT
