import cluster from "node:cluster";
import os from "node:os";

const CLUSTER_WORKERS = process.env.CLUSTER_WORKERS;
const WORKER_COUNT = CLUSTER_WORKERS
  ? Number(CLUSTER_WORKERS)
  : Math.max(os.cpus().length - 1, 1);

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} running migrations...`);

  const { runMigrations } = await import("./db/migrate.js");
  const { client } = await import("./db/index.js");
  await runMigrations();
  await client.end();

  console.log(`Migrations complete, starting ${WORKER_COUNT} workers`);

  const workerStartTimes = new Map<number, number>();

  for (let i = 0; i < WORKER_COUNT; i++) {
    const w = cluster.fork();
    workerStartTimes.set(w.id, Date.now());
  }

  cluster.on("exit", (worker, code) => {
    if (code === 0) return;

    const startTime = workerStartTimes.get(worker.id) ?? Date.now();
    const uptime = Date.now() - startTime;
    if (uptime < 5000) {
      console.error(
        `Worker ${worker.process.pid} crashed immediately (code ${code}), not restarting`,
      );
      if (Object.keys(cluster.workers ?? {}).length === 0) process.exit(1);
      return;
    }

    console.log(
      `Worker ${worker.process.pid} exited (code ${code}), restarting...`,
    );
    const w = cluster.fork();
    workerStartTimes.set(w.id, Date.now());
  });
} else {
  await import("./index.js");
}
