import { Route, Switch } from "wouter";
import Layout from "@/components/Layout";
import Explore from "@/pages/Explore";
import CreateTrip from "@/pages/CreateTrip";
import TripDetails from "@/pages/TripDetails";
import EditTrip from "@/pages/EditTrip";
import MyTrips from "@/pages/MyTrips";
import BrowserPage from "@/pages/BrowserPage";
import NotFound from "@/pages/not-found";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

function App() {
  // Load the default user (will always succeed in this app)
  const { data: currentUser, isLoading } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Layout user={currentUser}>
      <Switch>
        <Route path="/" component={Explore} />
        <Route path="/create" component={CreateTrip} />
        <Route path="/trip/:id" component={TripDetails} />
        <Route path="/trip/:id/edit" component={EditTrip} />
        <Route path="/my-trips" component={MyTrips} />
        <Route path="/browser">
          {() => (
            <div className="h-full w-full">
              <BrowserPage user={currentUser} />
            </div>
          )}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default App;
