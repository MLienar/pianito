import cluster from "node:cluster";
import os from "node:os";

const WORKER_COUNT =
  Number(process.env.CLUSTER_WORKERS) || Math.max(os.cpus().length - 1, 1);

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} running migrations...`);

  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  const { db } = await import("./db/index.js");
  await migrate(db, { migrationsFolder: "./drizzle" });

  console.log(`Migrations complete, starting ${WORKER_COUNT} workers`);

  for (let i = 0; i < WORKER_COUNT; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code) => {
    console.log(
      `Worker ${worker.process.pid} exited (code ${code}), restarting...`,
    );
    cluster.fork();
  });
} else {
  await import("./index.js");
  console.log(`Worker ${process.pid} started`);
}
