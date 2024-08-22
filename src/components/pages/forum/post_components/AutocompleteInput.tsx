import React, {
  useState,
  useEffect,
  ChangeEvent,
  KeyboardEvent,
  useRef,
} from "react";
import fetchTags from "./FetchTags";
import styles from "./AutocompleteInput.module.css";

const TAG_LIMIT = 3;

interface AutocompleteInputProps {
  setSelectedTags: (tags: string[]) => void;
  prevSelectedTags?: string[];
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  setSelectedTags,
  prevSelectedTags = [], // Default to an empty array if not provided
}) => {
  const [tags, setTags] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedTags, setLocalSelectedTags] = useState<string[]>([]);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] =
    useState<number>(-1);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const suggestionRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const loadTags = async () => {
      const fetchedTags = await fetchTags();
      setTags(fetchedTags);
      setSuggestionsWithFiltering(fetchedTags, selectedTags);
    };

    loadTags();
  }, []);

  useEffect(() => {
    if (prevSelectedTags.length > 0) {
      setLocalSelectedTags(prevSelectedTags);
      setSelectedTags(prevSelectedTags); // Update tags in PostModal
      setSuggestionsWithFiltering(tags, prevSelectedTags);
    }
  }, [prevSelectedTags, tags]);

  const setSuggestionsWithFiltering = (
    tags: string[],
    selectedTags: string[]
  ) => {
    const filtered = tags.filter((tag) => !selectedTags.includes(tag));
    setSuggestions(filtered);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value) {
      const filteredSuggestions = tags.filter((tag) =>
        tag.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestionsWithFiltering(filteredSuggestions, selectedTags);
      setFocusedSuggestionIndex(-1); // Reset focus when suggestions change
    } else {
      setSuggestionsWithFiltering(tags, selectedTags);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      // Move focus down
      setFocusedSuggestionIndex((prevIndex) => {
        const newIndex = Math.min(prevIndex + 1, suggestions.length - 1);
        suggestionRefs.current[newIndex]?.scrollIntoView({
          block: "nearest",
        });
        return newIndex;
      });
    } else if (e.key === "ArrowUp") {
      // Move focus up
      setFocusedSuggestionIndex((prevIndex) => {
        const newIndex = Math.max(prevIndex - 1, 0);
        suggestionRefs.current[newIndex]?.scrollIntoView({
          block: "nearest",
        });
        return newIndex;
      });
    } else if (e.key === "Enter") {
      // Add the currently focused suggestion or the typed value
      if (selectedTags.length < TAG_LIMIT) {
        const newTag =
          focusedSuggestionIndex >= 0
            ? suggestions[focusedSuggestionIndex]
            : inputValue;
        if (newTag && !selectedTags.includes(newTag)) {
          const newSelectedTags = [...selectedTags, newTag];
          setLocalSelectedTags(newSelectedTags);
          setSelectedTags(newSelectedTags); // Update tags in PostModal
          setInputValue("");
          setSuggestionsWithFiltering(tags, newSelectedTags);
        }
      }
    } else if (e.key === "Backspace" && !inputValue && selectedTags.length) {
      // Remove the last tag if Backspace is pressed and the input is empty
      const newSelectedTags = selectedTags.slice(0, -1);
      setLocalSelectedTags(newSelectedTags);
      setSelectedTags(newSelectedTags); // Update tags in PostModal
      setSuggestionsWithFiltering(tags, newSelectedTags);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (selectedTags.length < TAG_LIMIT && !selectedTags.includes(suggestion)) {
      const newSelectedTags = [...selectedTags, suggestion];
      setLocalSelectedTags(newSelectedTags);
      setSelectedTags(newSelectedTags); // Update tags in PostModal
      setInputValue("");
      setSuggestionsWithFiltering(tags, newSelectedTags);
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    const newSelectedTags = selectedTags.filter((tag) => tag !== tagToRemove);
    setLocalSelectedTags(newSelectedTags);
    setSelectedTags(newSelectedTags); // Update tags in PostModal
    setSuggestionsWithFiltering(tags, newSelectedTags);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    // Delay the blur event to allow click event to be registered
    setTimeout(() => {
      setIsFocused(false);
    }, 200);
  };

  return (
    <div className={styles.autocomplete}>
      <div className={styles.tagContainer}>
        {selectedTags.map((tag, index) => (
          <div key={index} className={styles.tag}>
            {tag}
            <span
              className={styles.tagClose}
              onClick={() => handleTagRemove(tag)}
            >
              x
            </span>
          </div>
        ))}
        {
          <input
            type="text"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="태그"
            className={styles.input}
          />
        }
      </div>
      {isFocused && suggestions.length > 0 && (
        <div className={styles.suggestionsDropdown}>
          <ul className={styles.suggestionsList}>
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                ref={(el) => (suggestionRefs.current[index] = el)}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`${styles.suggestionItem} ${
                  focusedSuggestionIndex === index ? styles.focused : ""
                }`}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;
