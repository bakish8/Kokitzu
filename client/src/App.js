import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
  lazy,
} from "react";
import { useQuery, useMutation } from "@apollo/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

// Import components
import ErrorBoundary from "./components/ErrorBoundary";
import AuthModal from "./components/AuthModal";
import Navigation from "./components/Navigation";
import LiveMarketData from "./components/LiveMarketData";
import BinaryOptions from "./components/BinaryOptions";
import Portfolio from "./components/Portfolio";
import BetConfirmationModal from "./components/BetConfirmationModal";

// Import hooks
import usePerformanceMonitor from "./hooks/usePerformanceMonitor";

// Import GraphQL queries and mutations
import {
  GET_CRYPTO_PRICES,
  GET_COINS,
  GET_USER_STATS,
  GET_ACTIVE_BETS,
  GET_BET_HISTORY,
  PLACE_BET,
  REGISTER,
  LOGIN,
} from "./graphql/queries";

// Import constants
import { TIMEFRAMES } from "./constants/timeframes";

// Lazy load components for better performance
const SkeletonCryptoCard = lazy(() =>
  import("./components/SkeletonCryptoCard")
);
const SkeletonStats = lazy(() => import("./components/SkeletonStats"));

const backgroundStyle = {
  backgroundImage: `url(${process.env.PUBLIC_URL}/images/backgroundImage.png)`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  minHeight: "100vh",
};

function App() {
  // Performance monitoring
  usePerformanceMonitor();

  // Optimized state management
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previousPrices, setPreviousPrices] = useState({});
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState("ONE_MINUTE");
  const [betAmount, setBetAmount] = useState(100);
  const [betType, setBetType] = useState("UP");
  const [showBetModal, setShowBetModal] = useState(false);
  const [activeTab, setActiveTab] = useState("prices");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    return token && user ? JSON.parse(user) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");

  const userId = "user-1";

  // Apollo auth link
  const httpLink = createHttpLink({ uri: "http://localhost:4000/graphql" });
  const authLink = setContext((_, { headers }) => {
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : "",
      },
    };
  });
  const apolloClient = useMemo(
    () =>
      new ApolloClient({
        link: authLink.concat(httpLink),
        cache: new InMemoryCache(),
      }),
    [token]
  );

  // Register/Login mutations
  const [registerMutation] = useMutation(REGISTER, { client: apolloClient });
  const [loginMutation] = useMutation(LOGIN, { client: apolloClient });

  // Auth handlers
  const handleAuth = async (username, password) => {
    setAuthError("");
    setAuthLoading(true);
    try {
      if (authMode === "register") {
        await registerMutation({ variables: { username, password } });
        setAuthMode("login");
        setAuthLoading(false);
        setAuthError("Registration successful! Please log in.");
        return;
      } else {
        const { data } = await loginMutation({
          variables: { username, password },
        });
        setUser(data.login.user);
        setToken(data.login.token);
        localStorage.setItem("token", data.login.token);
        localStorage.setItem("user", JSON.stringify(data.login.user));
        setAuthModalOpen(false);
      }
    } catch (e) {
      setAuthError(e.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken("");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // Show modal if not logged in
  useEffect(() => {
    if (!user) setAuthModalOpen(true);
  }, [user]);

  // Optimized queries with better caching
  const { loading, error, data, refetch } = useQuery(GET_CRYPTO_PRICES, {
    pollInterval: 30000,
    notifyOnNetworkStatusChange: true,
    errorPolicy: "all",
  });

  const { data: coinsData, loading: coinsLoading } = useQuery(GET_COINS, {
    errorPolicy: "all",
  });

  const { data: userStats } = useQuery(GET_USER_STATS, {
    variables: { userId },
    pollInterval: 10000,
    errorPolicy: "all",
  });

  const { data: activeBetsData } = useQuery(GET_ACTIVE_BETS, {
    variables: { userId },
    pollInterval: 5000,
    errorPolicy: "all",
  });

  const { data: betHistoryData, loading: betHistoryLoading } = useQuery(
    GET_BET_HISTORY,
    {
      variables: { userId },
      pollInterval: 10000,
      errorPolicy: "all",
    }
  );

  const [placeBet] = useMutation(PLACE_BET, {
    refetchQueries: [
      { query: GET_USER_STATS, variables: { userId } },
      { query: GET_ACTIVE_BETS, variables: { userId } },
    ],
    onError: (error) => {
      console.error("Bet placement error:", error);
    },
  });

  // Optimized animated prices with useMemo
  const animatedPrices = useMemo(() => {
    if (!data?.cryptoPrices) return [];
    return data.cryptoPrices.map((crypto) => crypto.price);
  }, [data?.cryptoPrices]);

  // Memoized filtered crypto data
  const filteredCryptoData = useMemo(() => {
    if (!data?.cryptoPrices) return [];
    return data.cryptoPrices.filter(
      (crypto) =>
        searchQuery === "" ||
        crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data?.cryptoPrices, searchQuery]);

  // Optimized handlers with useCallback
  const handleRefresh = useCallback(async () => {
    performance.mark("refresh-start");
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        performance.mark("refresh-end");
        performance.measure("refresh-duration", "refresh-start", "refresh-end");
      }, 1000);
    }
  }, [refetch]);

  const handlePlaceBet = useCallback(async () => {
    try {
      await placeBet({
        variables: {
          input: {
            cryptoSymbol: selectedCrypto,
            betType: betType,
            amount: parseFloat(betAmount),
            timeframe: selectedTimeframe,
          },
        },
      });
      setShowBetModal(false);
      setBetAmount(100);
    } catch (error) {
      console.error("Error placing bet:", error);
      alert(error.message);
    }
  }, [placeBet, selectedCrypto, betType, betAmount, selectedTimeframe]);

  const getPriceChange = useCallback(
    (symbol, currentPrice) => {
      const previousPrice = previousPrices[symbol];
      if (!previousPrice || previousPrice === currentPrice) return null;
      return {
        direction: currentPrice > previousPrice ? "up" : "down",
        percentage: (
          ((currentPrice - previousPrice) / previousPrice) *
          100
        ).toFixed(2),
      };
    },
    [previousPrices]
  );

  // Preload critical resources
  useEffect(() => {
    const preloadImage = new Image();
    preloadImage.src = `${process.env.PUBLIC_URL}/images/backgroundImage.png`;
  }, []);

  // Optimized price tracking
  useEffect(() => {
    if (data?.cryptoPrices) {
      setPreviousPrices((prev) => {
        const newPrices = {};
        data.cryptoPrices.forEach((crypto) => {
          newPrices[crypto.symbol] = prev[crypto.symbol] || crypto.price;
        });
        return newPrices;
      });
    }
  }, [data]);

  // Set default selected crypto when coins load
  useEffect(() => {
    if (!selectedCrypto && coinsData?.coins?.length > 0) {
      setSelectedCrypto(coinsData.coins[0].symbol);
    }
  }, [coinsData, selectedCrypto]);

  // Helper for timer with memoization
  const getTimeLeft = useCallback((expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    if (diff <= 0) return "Expired";
    const min = Math.floor(diff / 60000);
    const sec = Math.floor((diff % 60000) / 1000);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  }, []);

  const getCurrentCrypto = useCallback(() => {
    return data?.cryptoPrices?.find(
      (crypto) => crypto.symbol === selectedCrypto
    );
  }, [data, selectedCrypto]);

  const getSelectedTimeframeInfo = useCallback(() => {
    return TIMEFRAMES.find((tf) => tf.value === selectedTimeframe);
  }, [selectedTimeframe]);

  // Timer update for Active Bets
  const [, setTimerTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick((tick) => tick + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Error handling
  if (error && !data) {
    return (
      <div className={`app ${isDarkMode ? "dark" : "light"}`}>
        <div className="error-container">
          <div className="kokitzu-logo">Kokitzu</div>
          <div className="error-message">
            <h2>Connection Error</h2>
            <p>{error.message}</p>
            <button onClick={handleRefresh} className="retry-button">
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ApolloProvider client={apolloClient}>
      {authModalOpen && (
        <AuthModal
          mode={authMode}
          setMode={setAuthMode}
          onSubmit={handleAuth}
          error={authError}
          loading={authLoading}
        />
      )}
      <Router>
        <ErrorBoundary>
          <div style={backgroundStyle}>
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                zIndex: 0,
                pointerEvents: "none",
                background: isDarkMode
                  ? "rgba(0,0,0,0.5)"
                  : "rgba(255,255,255,0.9)",
              }}
            />
            <div className={`app ${isDarkMode ? "dark" : "light"}`}>
              {/* Navigation */}
              <Navigation
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                isRefreshing={isRefreshing}
                handleRefresh={handleRefresh}
                user={user}
                handleLogout={handleLogout}
                setAuthModalOpen={setAuthModalOpen}
                isMobileNavOpen={isMobileNavOpen}
                setActiveTab={setActiveTab}
                coinsData={coinsData}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                setSelectedCrypto={setSelectedCrypto}
                setBetType={setBetType}
                setSelectedTimeframe={setSelectedTimeframe}
                setBetAmount={setBetAmount}
              />

              {/* Main Content */}
              <main className="main-content">
                <div className="breadcrumb">
                  <span className="breadcrumb-item">Kokitzu</span>
                  <span className="breadcrumb-item active">
                    {window.location.pathname === "/" && "Live Prices"}
                    {window.location.pathname === "/betting" &&
                      "Binary Options"}
                    {window.location.pathname === "/portfolio" && "Portfolio"}
                  </span>
                </div>

                {/* Search Functionality */}
                {window.location.pathname === "/" && (
                  <div className="search-container">
                    <svg
                      className="search-icon"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search cryptocurrencies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                )}

                <Routes>
                  <Route
                    path="/"
                    element={
                      <LiveMarketData
                        filteredCryptoData={filteredCryptoData}
                        loading={loading}
                        SkeletonCryptoCard={SkeletonCryptoCard}
                        getPriceChange={getPriceChange}
                        animatedPrices={animatedPrices}
                        setSelectedCrypto={setSelectedCrypto}
                        setBetType={setBetType}
                      />
                    }
                  />
                  <Route
                    path="/betting"
                    element={
                      <BinaryOptions
                        coinsData={coinsData}
                        data={data}
                        loading={loading}
                        SkeletonCryptoCard={SkeletonCryptoCard}
                        selectedCrypto={selectedCrypto}
                        setSelectedCrypto={setSelectedCrypto}
                        selectedTimeframe={selectedTimeframe}
                        setSelectedTimeframe={setSelectedTimeframe}
                        betAmount={betAmount}
                        setBetAmount={setBetAmount}
                        betType={betType}
                        setBetType={setBetType}
                        getSelectedTimeframeInfo={getSelectedTimeframeInfo}
                        handlePlaceBet={handlePlaceBet}
                        showBetModal={showBetModal}
                        setShowBetModal={setShowBetModal}
                        getPriceChange={getPriceChange}
                        animatedPrices={animatedPrices}
                        activeBetsData={activeBetsData}
                        getTimeLeft={getTimeLeft}
                        currentPrice={getCurrentCrypto()?.price}
                      />
                    }
                  />
                  <Route
                    path="/portfolio"
                    element={
                      <Portfolio
                        userStats={userStats}
                        betHistoryLoading={betHistoryLoading}
                        betHistoryData={betHistoryData}
                        getTimeLeft={getTimeLeft}
                        currentPrice={getCurrentCrypto()?.price}
                      />
                    }
                  />
                </Routes>
              </main>

              {/* Bet Confirmation Modal */}
              <BetConfirmationModal
                showBetModal={showBetModal}
                setShowBetModal={setShowBetModal}
                selectedCrypto={selectedCrypto}
                betType={betType}
                betAmount={betAmount}
                getSelectedTimeframeInfo={getSelectedTimeframeInfo}
                handlePlaceBet={handlePlaceBet}
              />

              {/* Footer */}
              <footer className="footer">
                <div className="footer-content">
                  <div className="footer-links">
                    <span>Powered by CoinGecko</span>
                    <span>•</span>
                    <span>Binary Options Trading</span>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </ErrorBoundary>
      </Router>
    </ApolloProvider>
  );
}

export default App;
