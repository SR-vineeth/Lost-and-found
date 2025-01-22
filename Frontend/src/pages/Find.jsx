import React, { useState, useEffect } from "react";
import Itemcard from "../components/ItemCard";
import Navbar from "../components/Navbar";
import axios from "axios";
import { api } from "../config";
import HashLoader from "react-spinners/HashLoader";
import AOS from "aos";
import "aos/dist/aos.css";
import { useSnackbar } from "notistack";

function Find() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    AOS.init({ duration: 750 });
  }, []);

  const override = {
    display: "block",
    borderColor: "#fdf004",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
  };

  const fetchItems = async () => {
    try {
      const response = await axios.get(`${api}/item`);
      const sortedItems = response.data.data.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setItems(sortedItems);
      setFilteredItems(sortedItems);
      setLoading(false);
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Error loading items", { variant: "error" });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setFilteredItems(
      items.filter(
        (findItem) =>
          findItem.title.toLowerCase().includes(query) ||
          findItem.description.toLowerCase().includes(query)
      )
    );
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${api}/item/${id}`);
      enqueueSnackbar("Item deleted successfully", { variant: "success" });
      fetchItems(); // Refresh the list after deletion
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Error deleting item", { variant: "error" });
    }
  };

  return (
    <main id="findpage">
      <Navbar />
      <section>
        <h1 className="lfh1">Lost and Found Items</h1>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={handleSearch}
            className="search-box"
          />
        </div>
        <div className="item-container">
          {loading ? (
            <HashLoader
              color="#fdf004"
              loading={loading}
              cssOverride={override}
              size={50}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
          ) : (
            <>
              {filteredItems.map((findItem) => (
                <Itemcard
                  key={findItem._id}
                  id={findItem._id}
                  title={findItem.title}
                  description={findItem.description}
                  image={findItem.image}
                  onDelete={() => handleDelete(findItem._id)}
                />
              ))}
              <div className="extraItem"></div>
              <div className="extraItem"></div>
              <div className="extraItem"></div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default Find;