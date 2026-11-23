// Antes de `npm run dev`: se a porta já estiver em uso, avisa em vez de subir um 2º servidor
// (que iria para a porta 3001 e disputaria o mesmo banco local com o primeiro).
import net from "node:net";

const port = Number(process.env.PORT ?? 3000);
const socket = net.connect({ port, host: "127.0.0.1" });
socket.once("connect", () => {
  socket.destroy();
  console.error(`\n⚠️  Já existe um servidor rodando na porta ${port}.`);
  console.error(`   Para reiniciar: vá no terminal onde ele está rodando e aperte Ctrl+C, depois rode "npm run dev" de novo.`);
  console.error(`   Ou rode "npm run dev:restart", que encerra o servidor antigo e sobe o novo.\n`);
  process.exit(1);
});
socket.once("error", () => process.exit(0));
