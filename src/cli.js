import fs from "node:fs";
import { Command } from "commander";
import chalk from "chalk";
import Table from "cli-table3";
import yaml from "js-yaml";
import { randomInt } from "node:crypto";
import { TaskStore } from "./storage.js";
import { Config } from "./config.js";
import { formatTime, priorityColor, statusColor, colorize } from "./utils.js";

const config = new Config();
const store = new TaskStore(config.get("storage_path"));

export const program = new Command();

program
  .name("cmddo")
  .description("CmdDo - 开发者的命令行待办清单工具")
  .version("0.1.0");

// ── add ──
program
  .command("add <content>")
  .description("添加新任务")
  .option("-p, --priority <level>", "优先级 (high/med/low)", "med")
  .option("-t, --tag <tag>", "任务标签")
  .action((content, opts) => {
    const task = {
      id: String(randomInt(100000, 999999)),
      content,
      priority: opts.priority,
      tag: opts.tag || null,
      created_at: new Date().toISOString().slice(0, 19),
      completed_at: null,
      status: "pending",
    };
    store.add(task);
    const theme = config.get("theme");
    const color = priorityColor(task.priority, theme);
    console.log(`${chalk.green.bold("✓")} 已添加: ${colorize(task.id, color)} ${task.content}`);
  });

// ── list ──
program
  .command("list")
  .description("列出所有任务")
  .option("-s, --status <status>", "按状态筛选 (pending/done)")
  .action((opts) => {
    const tasks = store.list(opts.status);
    if (!tasks.length) {
      console.log(chalk.dim("暂无任务。使用 cmddo add \"任务内容\" 添加"));
      return;
    }
    const theme = config.get("theme");
    const table = new Table({
      head: ["ID", "优先级", "内容", "标签", "创建时间", "状态"].map((h) =>
        chalk.cyan.bold(h)
      ),
      style: { head: [], border: [] },
      chars: { mid: "", "left-mid": "", "mid-mid": "", "right-mid": "" },
    });
    for (const t of tasks) {
      const pColor = priorityColor(t.priority, theme);
      const sColor = statusColor(t.status, theme);
      const content =
        t.status === "done"
          ? chalk.dim.strikethrough(t.content)
          : t.content;
      const status = t.status === "done" ? chalk.bold[sColor]("✓") : chalk[sColor]("○");
      table.push([
        chalk.dim(t.id),
        colorize(t.priority.toUpperCase(), pColor),
        content,
        chalk.magenta(t.tag || ""),
        chalk.dim(formatTime(t.created_at)),
        status,
      ]);
    }
    console.log(table.toString());
  });

// ── done ──
program
  .command("done <id>")
  .description("标记任务为完成（支持 ID 前缀匹配）")
  .action((id) => {
    const resolved = resolveId(id);
    if (!resolved) {
      console.log(`${chalk.red.bold("✗")} 任务 ${chalk.cyan(id)} 不存在`);
      return;
    }
    const task = store.done(resolved);
    if (task) {
      console.log(`${chalk.green.bold("✓")} 已完成: ${chalk.cyan(resolved)} ${task.content}`);
    } else {
      console.log(`${chalk.red.bold("✗")} 任务 ${chalk.cyan(id)} 不存在`);
    }
  });

// ── remove ──
program
  .command("remove <id>")
  .description("永久删除任务（支持 ID 前缀匹配）")
  .action((id) => {
    const resolved = resolveId(id);
    if (!resolved) {
      console.log(`${chalk.red.bold("✗")} 任务 ${chalk.cyan(id)} 不存在`);
      return;
    }
    if (store.remove(resolved)) {
      console.log(`${chalk.red.bold("✗")} 已删除: ${chalk.cyan(resolved)}`);
    } else {
      console.log(`${chalk.red.bold("✗")} 任务 ${chalk.cyan(id)} 不存在`);
    }
  });

// ── export ──
program
  .command("export")
  .description("导出任务为 Markdown 或 CSV")
  .option("-f, --format <fmt>", "导出格式 (markdown/csv)", "markdown")
  .option("-o, --output <file>", "输出文件路径")
  .action((opts) => {
    const tasks = store.list();
    if (!tasks.length) {
      console.log(chalk.dim("暂无任务可导出。"));
      return;
    }
    let content;
    if (opts.format === "csv") {
      const lines = ["id,priority,content,tag,created_at,status"];
      for (const t of tasks) {
        lines.push(
          [t.id, t.priority, t.content, t.tag || "", t.created_at, t.status].map(csvEscape).join(",")
        );
      }
      content = lines.join("\n");
    } else {
      const lines = ["| ID | Priority | Content | Tag | Created | Status |"];
      lines.push("|---|---|---|---|---|---|");
      for (const t of tasks) {
        lines.push(
          `| ${t.id} | ${t.priority} | ${t.content} | ${t.tag || ""} | ${t.created_at} | ${t.status} |`
        );
      }
      content = lines.join("\n");
    }
    if (opts.output) {
      fs.writeFileSync(opts.output, content, "utf-8");
      console.log(`${chalk.green.bold("✓")} 已导出到 ${chalk.cyan(opts.output)}`);
    } else {
      console.log(content);
    }
  });

// ── stats ──
program
  .command("stats")
  .description("显示任务统计和本周活跃度")
  .action(() => {
    const tasks = store.list();
    if (!tasks.length) {
      console.log(chalk.dim("暂无任务。"));
      return;
    }
    const total = tasks.length;
    const doneCount = tasks.filter((t) => t.status === "done").length;
    const pendingCount = total - doneCount;
    const priCount = { high: 0, med: 0, low: 0 };
    for (const t of tasks) priCount[t.priority]++;

    const summary = new Table({
      style: { head: [], border: [] },
      chars: { mid: "", "left-mid": "", "mid-mid": "", "right-mid": "" },
    });
    summary.push(
      [chalk.bold("任务总数"), total],
      [chalk.green("已完成"), doneCount],
      [chalk.yellow("待完成"), pendingCount],
      ["高优先级", chalk.red(priCount.high)],
      ["中优先级", chalk.yellow(priCount.med)],
      ["低优先级", chalk.green(priCount.low)]
    );
    console.log(summary.toString());

    // 本周柱状图
    const now = new Date();
    const weekAgo = new Date(now - 7 * 86400000);
    const daily = {};
    for (const t of tasks) {
      if (t.status === "done" && t.completed_at) {
        const d = new Date(t.completed_at);
        if (d >= weekAgo) {
          const key = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          daily[key] = (daily[key] || 0) + 1;
        }
      }
    }
    const entries = Object.entries(daily).sort();
    if (entries.length) {
      console.log(chalk.bold("\n本周完成情况"));
      const max = Math.max(...entries.map(([, v]) => v));
      for (const [day, count] of entries) {
        const barLen = max > 0 ? Math.round((count / max) * 20) : 0;
        console.log(`  ${day}  ${chalk.green("█".repeat(barLen))} ${count}`);
      }
    } else {
      console.log(chalk.dim("\n本周暂无完成的任务。"));
    }
  });

// ── config ──
program
  .command("config [key] [value]")
  .description("查看或设置配置")
  .action((key, value) => {
    if (key && value) {
      config.set(key, value);
      console.log(`${chalk.green.bold("✓")} 已设置 ${chalk.cyan(key)} = ${value}`);
    } else {
      console.log(yaml.dump(config.show(), { lineWidth: -1 }));
    }
  });

// ── helper ──
function resolveId(id) {
  const result = store.resolveIdVerbose(id);
  if (result.id) return result.id;
  if (result.ambiguous) {
    console.log(
      `${chalk.yellow("歧义")} ID 前缀 ${chalk.cyan(id)} 匹配多个任务: ${result.matches.join(", ")}`
    );
    console.log(chalk.dim("请输入更多字符以唯一匹配。"));
  }
  return null;
}

function csvEscape(val) {
  const s = String(val ?? "");
  return /[,"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
