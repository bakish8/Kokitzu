import express from "express";
import { ApolloServer } from "apollo-server-express";
import cors from "cors";
import { typeDefs } from "./schema.js";
import { resolvers } from "./resolvers.js";
import mongoose from "mongoose";

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS
app.use(cors());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "CryptoGraphQL Server",
  });
});

const MONGO_URI =
  "mongodb+srv://BAKISH:HbLErnUQnbKppcPI@kokitzu.rqazpbf.mongodb.net/?retryWrites=true&w=majority";

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: true,
  context: ({ req }) => {
    return { req };
  },
});

async function startServer() {
  await server.start();

  // Apply Apollo Server middleware to Express
  server.applyMiddleware({
    app,
    path: "/graphql",
    cors: {
      origin: ["http://localhost:3000", "http://localhost:3001"],
      credentials: true,
    },
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}`);
    console.log(
      `📊 GraphQL endpoint: http://localhost:${PORT}${server.graphqlPath}`
    );
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(
      `🔍 GraphQL Playground: http://localhost:${PORT}${server.graphqlPath}`
    );
  });
}

startServer().catch(console.error);
