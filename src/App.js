import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";

import { useNavigate } from "react-router-dom";
import * as Automerge from "automerge";
import localforage from "localforage";
import Header from "./components/Header";
import ContentWrapper from "./components/ContentWrapper";
import DocumentCard from "./components/DocumentCard";
import AddButton from "./components/AddButton";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { v4 as uuidv4 } from "uuid";
import mammoth from "mammoth";

// Initialize Automerge document
let doc = Automerge.init();
const modules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{'list': 'ordered'}, {'list': 'bullet'}],
    ['link', 'image', 'video'],
    [{'color': []}, {'background': []}],
    ['clean'],
    // Add your custom options here
    [{'align': []}], // Example: Add text alignment options
    [{'indent': '-1'}, {'indent': '+1'}], // Example: Add indentation options
  ],
};
// Main App component
export default function App() {
  // React Router navigation hook
  const navigate = useNavigate();

  // State variables
  const [editorVisible, setEditorVisible] = useState(false);
  const [editorValue, setEditorValue] = useState("");
  const [changeLog, setChangeLog] = useState([]);
  const [showChangeLog, setShowChangeLog] = useState(false);
  const [commentedValue, setCommentedValue] = useState([]);

  // Extract document ID from the URL
  let docId = window.location.pathname.split("/").pop();

  // Create a BroadcastChannel for communication between tabs
  let channel = useMemo(() => {
    return new BroadcastChannel(docId);
  }, [docId]);

  // Function to generate a unique user ID
  const getCurrentUserId = () => {
    let userId = localStorage.getItem("userId");

    if (!userId) {
      userId = `user_${Math.floor(Math.random() * 1000000)}`;
      localStorage.setItem("userId", userId);
    }

    const tabId = Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    return `${userId}_${tabId}`;
  };

  // Function to initialize documents
  const initDocuments = useCallback(() => {
    if (localforage.getItem("automerge-data") && !docId) {
      setEditorVisible(false);

      async function getItem() {
        return await localforage.getItem("automerge-data");
      }

      getItem()
        .then((item) => {
          if (item) {
            doc = Automerge.load(item);
            navigate(`/`);
          }
        })
        .catch((err) => console.log(err));
    }
  }, [navigate, docId]);

  // useEffect hook to initialize documents on component mount
  useEffect(() => {
    initDocuments();
  }, [initDocuments]);

  // useEffect hook to log commentedValue for testing
  useEffect(() => {
    console.log("commentedValue is", commentedValue);
  }, [commentedValue]);

  // Function to add a new document
  const addDocument = () => {
    const id = uuidv4();
    let newDoc = Automerge.change(doc, (doc) => {
      setEditorValue("");
      if (!doc.documents) doc.documents = [];
      doc.documents.push({
        id,
        text: editorValue,
        done: false,
        userId: getCurrentUserId(),
      });
      navigate(`/${id}`);
    });

    let binary = Automerge.save(newDoc);
    localforage.clear();
    localforage
      .setItem("automerge-data", binary)
      .catch((err) => console.log(err));
    doc = newDoc;

    const changeText = `New document added: ${id} (by ${getCurrentUserId()})`;
    setChangeLog((prevLog) => [...prevLog, changeText]);

    setShowChangeLog(true);
  };

  // Function to load a document
  const loadDocument = useCallback(() => {
    if (docId) {
      setEditorVisible(true);
      setEditorValue("");

      async function getItem() {
        return await localforage.getItem("automerge-data");
      }

      getItem()
        .then((item) => {
          if (item) {
            doc = Automerge.load(item);

            const itemIndex = doc.documents.findIndex(
              (item) => item.id === docId,
            );

            if (itemIndex !== -1) {
              setEditorValue(doc.documents[itemIndex].text);
            } else {
              navigate("/");
              setEditorVisible(false);
            }
          }
        })
        .catch((err) => console.log(err));
    }
  }, [docId, navigate]);

  // useEffect hook to load a document on component mount
  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  // Function to update a document
  const updateDocument = useCallback(() => {
    if (Object.keys(doc).length !== 0) {
      const itemIndex = doc.documents.findIndex((item) => item.id === docId);

      if (itemIndex !== -1) {
        doc = Automerge.change(doc, (doc) => {
          doc.documents[itemIndex].text = editorValue;
        });

        let binary = Automerge.save(doc);
        localforage
          .setItem("automerge-data", binary)
          .catch((err) => console.log(err));

        const changeText = ` ${editorValue} (by ${getCurrentUserId()}) `;
        const regex = /(<([^>]+)>)/gi;
        const result = changeText.replace(regex, "");

        setChangeLog((prevLog) => [...prevLog, result]);

        setShowChangeLog(true);

        channel.postMessage(binary);
        console.log(`channel${channel}`);
      }
    }
  }, [docId, editorValue, channel]);

  // useEffect hook to update a document on editor value change
  useEffect(() => {
    updateDocument();
  }, [updateDocument]);

  // Function to update a document and clear editor value
  const updateDocument2 = useCallback(() => {
    if (Object.keys(doc).length !== 0) {
      const itemIndex = doc.documents.findIndex((item) => item.id === docId);

      if (itemIndex !== -1) {
        doc = Automerge.change(doc, (doc) => {
          setEditorValue("");
          setCommentedValue((prevComments) =>
          prevComments.filter((comment) => !comment.includes(`${docId}`))
        );
        });

        let binary = Automerge.save(doc);
        localforage
          .setItem("automerge-data", binary)
          .catch((err) => console.log(err));

        const changeText = ` ${editorValue} (by ${getCurrentUserId()}) `;

        setChangeLog((prevLog) => [...prevLog, changeText]);

        setShowChangeLog(true);

        channel.postMessage(binary);
        console.log(`channel${channel}`);
      }
    }
  }, [docId, editorValue, channel]);

  // Function to delete a document
  const deleteDocument = (docId) => {
    if (Object.keys(doc).length !== 0) {
      const itemIndex = doc.documents.findIndex((item) => item.id === docId);

      if (itemIndex !== -1) {
        let newDoc = Automerge.change(doc, (doc) => {
          doc.documents.splice(itemIndex, 1);
        });

        let binary = Automerge.save(newDoc);
        localforage
          .setItem("automerge-data", binary)
          .catch((err) => console.log(err));
        doc = newDoc;

        const changeText = `Document ${docId} deleted (by ${getCurrentUserId()})`;
        setChangeLog((prevLog) => [...prevLog, changeText]);
        setShowChangeLog(true);
        channel.postMessage(binary);
      }
      navigate("/");
    }
  };

  const syncDocument = useCallback(() => {
    channel.onmessage = (ev) => {
      let newDoc = Automerge.merge(doc, Automerge.load(ev.data));
      doc = newDoc;
    };
  }, [channel]);

  // useEffect hook to sync documents on component mount
  useEffect(() => {
    syncDocument();
  }, [syncDocument]);

  // Function to save commented values
  const Savingcommentedvalues = (comment) => {
    var promptValue = window.prompt("Please enter Comment", "");
    console.log("commentedValue ok", commentedValue);
    setCommentedValue((prevComments) => [
      ...prevComments,

      
      `${docId}: ${comment}: ${promptValue}`,
    ]);
    console.log("commentedValue ok", commentedValue);
  };
  useEffect(() => {
    const loadCommentedValues = async () => {
      try {
        const storedCommentedValue = await localforage.getItem("commentedValue");
        if (storedCommentedValue) {
          setCommentedValue(storedCommentedValue);
        }
      } catch (error) {
        console.error("Error loading commented values from LocalForage:", error);
      }
    };

    loadCommentedValues();
  }, []);

  // Save commented values to LocalForage whenever commentedValue changes
  useEffect(() => {
    const saveCommentedValues = async () => {
      try {
        await localforage.setItem("commentedValue", commentedValue);
      } catch (error) {
        console.error("Error saving commented values to LocalForage:", error);
      }
    };

    saveCommentedValues();
  }, [commentedValue]);

  // Function to handle file change (e.g., when uploading a .docx file)
  const handleFileChange = async (event) => {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = async (e) => {
        const content = e.target.result;

        try {
          const { value } = await mammoth.extractRawText({
            arrayBuffer: content,
          });
          setEditorValue(value);
        } catch (error) {
          console.error("Error converting .docx to HTML:", error);
        }
      };

      reader.readAsArrayBuffer(file);
    }
  };
  const renderCommentedValues = (currentDocId) => {
    // Render commented values only when editor is visible
    if (editorVisible) {
      const filteredComments = commentedValue.filter(comment =>
        comment.includes(`${currentDocId}`)
      );
  
      return (
        <div>
          <h3>Comments</h3>
          <ul>
            {filteredComments.map((comment, index) => (
              <li key={index}>{comment.split(":").slice(1).join(":").trim()}</li>
            ))}
          </ul>
        </div>
      );
    } else {
      return null; // Return null if editor is not visible
    }
  };
  const [selectedText, setSelectedText] = useState("");
  const quillRef = useRef(null);

  // ... (previous code)

  // useEffect hook to set up the selection change callback
  useEffect(() => {
    if (editorVisible) {
      const quill = quillRef.current.getEditor();

      // Event listener for text selection change

      quill.on("selection-change", (range, oldRange, source) => {
        if (range) {
          // Get the selected text using Quill API
          console.log("collest range is", range);
          const selectedContent = quill.getText(range.index, range.length);
          // Convert Quill Delta to plain text

          console.log(" is", selectedContent);
          setSelectedText(selectedContent);
        } else {
          setSelectedText("");
        }
      });
    }
  }, [editorVisible]);

  // Return the JSX for the component
  return (
    <div className="wrapper">
      <Header
        onClick={() => {
          setEditorVisible(false);
          navigate("/");
        }}
      />
      <div className="main-content">
        {editorVisible && (
          <>
            <button
              type="button"
              id="comment-button"
              style={{ width: "139px", color: "white" }}
              onClick={() => Savingcommentedvalues(selectedText)}
            >
              Add
            </button>

            <button onClick={() => setShowChangeLog(!showChangeLog)}>
              {showChangeLog ? "Hide Change Log" : "Show Change Log"}
            </button>
            <input type="file" onChange={handleFileChange} />

            {showChangeLog && (
              <div className="change-log">
                <h3>Change Log:</h3>
                <ul>
                  {changeLog.length > 1 ? (
                    <li key={changeLog.length - 1}>
                      <button onClick={updateDocument}>Accept Changes</button>
                      <button onClick={updateDocument2}>Reject Changes</button>
                    </li>
                  ) : (
                    changeLog.map((change, index) => (
                      <li key={index}>{change}</li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      <div className="content-container">
      {commentedValue.length > 0 && renderCommentedValues(docId)}

        {!editorVisible ? (
          <ContentWrapper>
            {Object.keys(doc).length !== 0 &&
              doc.documents.map((document, index) => {
                return (
                  <DocumentCard
                    key={index}
                    text={document.text}
                    onClick={() => {
                      setEditorVisible(true);
                      navigate(`/${document.id}`);
                    }}
                    deleteHandler={(e) => {
                      alert("Are you sure you want to delete?");
                      e.stopPropagation();
                      deleteDocument(document.id);
                    }}
                  />
                );
              })}
            <AddButton
              onClick={() => {
                setEditorVisible(true);
                addDocument();
              }}
            />
          </ContentWrapper>
        ) : (
          <div>
            <ReactQuill
      ref={quillRef}
      style={{ height: "300px", width: "900px", marginLeft: 29 }}
      value={editorValue}
      onChange={setEditorValue}
      modules={modules}
    />
          </div>
        )}
      </div>
    </div>
  );
}
