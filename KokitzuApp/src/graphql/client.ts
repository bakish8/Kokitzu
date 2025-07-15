import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getGraphQLUrl } from "../config/network";

// Create Apollo Client with constant URL initialization
let apolloClient: ApolloClient<any> | null = null;

export const initializeApolloClient = async () => {
  try {
    // Get constant URL
    const graphqlUrl = await getGraphQLUrl();
    console.log("🔗 Initializing Apollo Client with:", graphqlUrl);

    const httpLink = createHttpLink({
      uri: graphqlUrl,
    });

    const authLink = setContext(async (_, { headers }) => {
      const token = await AsyncStorage.getItem("token");
      return {
        headers: {
          ...headers,
          authorization: token ? `Bearer ${token}` : "",
        },
      };
    });

    apolloClient = new ApolloClient({
      link: authLink.concat(httpLink),
      cache: new InMemoryCache(),
    });

    return apolloClient;
  } catch (error) {
    console.error("❌ Error initializing Apollo Client:", error);
    throw error;
  }
};

// Get the initialized client
export const getApolloClient = () => {
  if (!apolloClient) {
    throw new Error(
      "Apollo Client not initialized. Call initializeApolloClient() first."
    );
  }
  return apolloClient;
};

// Simplified refresh function (no longer needed but kept for compatibility)
export const refreshApolloClient = async () => {
  try {
    console.log("🔄 Refreshing Apollo Client...");
    apolloClient = await initializeApolloClient();
    return apolloClient;
  } catch (error) {
    console.error("❌ Error refreshing Apollo Client:", error);
    throw error;
  }
};

// Legacy export for backward compatibility
export { apolloClient };
