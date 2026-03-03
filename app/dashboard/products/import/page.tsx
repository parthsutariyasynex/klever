// // "use client";

// // import Papa from "papaparse";
// // import { useState } from "react";

// // export default function ImportPage() {
// //   const [loading, setLoading] = useState(false);
// //   const [message, setMessage] = useState("");

// //  const handleFileUpload = (file: File) => {
// //   setLoading(true);
// //   setMessage("");

// //   Papa.parse(file, {
// //     header: true,
// //     skipEmptyLines: true,
// //     delimiter: "\t", // jo tab separated hoy to ok
// //     complete: async (results) => {
// //       console.log("Parsed CSV data:", results.data);

// //       try {
// //         const response = await fetch("/api/products/import", {
// //           method: "POST",
// //           headers: {
// //             "Content-Type": "application/json",
// //           },
// //           body: JSON.stringify({ data: results.data }),
// //         });

// //         const data = await response.json();

// //         if (!response.ok) {
// //           setMessage(data.error || "Import failed");
// //         } else {
// //           setMessage(data.message);
// //         }
// //       } catch (error) {
// //         console.error(error);
// //         setMessage("Something went wrong");
// //       } finally {
// //         setLoading(false);
// //       }
// //     },
// //   });
// // };
// // }



// "use client";

// import Papa from "papaparse";
// import { useState } from "react";

// export default function ImportPage() {
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");

//   const handleFileUpload = (file: File) => {
//     setLoading(true);
//     setMessage("");

//     Papa.parse(file, {
//       header: true,
//       skipEmptyLines: true,
//       delimiter: ",", // change to "\t" if tab-separated
//       complete: async (results) => {
//         try {
//           const response = await fetch("/api/products/import", {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//               data: results.data,
//             }),
//           });

//           const data = await response.json();

//           if (!response.ok) {
//             setMessage(data.error || "Import failed");
//           } else {
//             setMessage(data.message);
//           }
//         } catch (error) {
//           console.error(error);
//           setMessage("Something went wrong");
//         } finally {
//           setLoading(false);
//         }
//       },
//     });
//   };

//   return (
//     <div>
//       <h2>Import Products</h2>

//       <input
//         type="file"
//         accept=".csv"
//         onChange={(e) => {
//           if (e.target.files?.[0]) {
//             handleFileUpload(e.target.files[0]);
//           }
//         }}
//       />

//       {loading && <p>Importing...</p>}
//       {message && <p>{message}</p>}
//     </div>
//   );
// }




"use client";
type CsvRow = Record<string, string>;
import Papa from "papaparse";
import { useState } from "react";

export default function ImportPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  // const [csvData, setCsvData] = useState<unknown[]>([]);
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);

  const handleFileUpload = (file: File) => {
    setLoading(true);
    setMessage("");

    Papa.parse(file, {
  header: true,
  skipEmptyLines: true,
  delimiter: ",",
  complete: (results) => {
    const data = results.data as CsvRow[];
    setCsvData(data);
    setColumns(Object.keys(data[0] || {}));
        setLoading(false);
      },
    });
  };

  const handleImport = async () => {
    if (!csvData.length) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/products/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: csvData }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Import failed");
      } else {
        setMessage(data.message || "Import successful");
        setCsvData([]);
      }
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Import Products</h2>

      <input
        type="file"
        accept=".csv"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
      />

      {loading && <p>Processing...</p>}
      {message && <p>{message}</p>}

      {/* Table Preview */}
      {csvData.length > 0 && (
        <>
          <div style={{ overflowX: "auto", marginTop: "20px" }}>
            <table border={1} cellPadding={8} style={{ width: "100%" }}>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvData.map((row, index) => (
                  <tr key={index}>
                    {columns.map((col) => (
                      <td key={col}>{row[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleImport}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: "black",
              color: "white",
              cursor: "pointer",
            }}
          >
            Confirm Import
          </button>
        </>
      )}
    </div>
  );
}