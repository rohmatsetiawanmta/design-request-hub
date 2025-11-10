import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const App = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: fetchedData, error } = await supabase
        .from("test")
        .select("*");

      if (error) {
        console.error("Error fetching data:", error);
      } else {
        setData(fetchedData);
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Design Request Hub</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          {data ? (
            <p>Berhasil terhubung. Jumlah item data: {data.length}</p>
          ) : (
            <p>Tidak ada data atau terjadi kesalahan.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
