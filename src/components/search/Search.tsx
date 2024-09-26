import "instantsearch.css/themes/satellite.css";
import { Hits } from "react-instantsearch";

import { Hit } from "./Hit";
import "./Search.css";

export const Search = () => {
  return (
    <div className="ais-InstantSearch">
      <Hits hitComponent={Hit} />
    </div>
  );
};
