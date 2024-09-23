import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../../app/store";
import styles from "./AddPartner.module.css";

const AddPartner = () => {
  const [existingCode, setExistingCode] = useState<string | null>(null);
  const [codeExpiration, setCodeExpiration] = useState<Date | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState<string>(""); // Input for partner code
  const [loading, setLoading] = useState<boolean>(true); // To handle loading state
  const [message, setMessage] = useState<string>("");
  const location = useLocation();

  const { familyId } = location.state || {}; // Assuming familyId is passed in location.state
  const currentUser = useSelector((state: RootState) => state.currentUser.user);
  const [copySuccess, setCopySuccess] = useState<boolean>(false); // State for copy notification

  // Function to generate a 6-character alphanumeric code
  const generateSimpleCode = (length: number = 6) => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };

  // Function to check if an existing non-expired code exists
  const getExistingCode = async () => {
    const familyRef = doc(db, "families", familyId);
    const familySnapshot = await getDoc(familyRef);

    if (familySnapshot.exists()) {
      const familyData = familySnapshot.data();
      const partnerCode = familyData.partnerCode;
      const expiration = familyData.codeExpiration?.toDate();

      if (partnerCode && expiration && expiration > new Date()) {
        setExistingCode(partnerCode);
        setCodeExpiration(expiration);
        return;
      }
    }
    setExistingCode(null);
  };

  // Function to generate a unique invite code
  const generateUniqueCode = async (): Promise<string> => {
    let code: string;
    let codeExists: boolean;

    do {
      // Generate a new 6-character code
      code = generateSimpleCode(6);

      // Check Firestore by document ID (using the code as the document ID)
      const inviteCodeRef = doc(db, "inviteCodes", code);
      const docSnapshot = await getDoc(inviteCodeRef);

      // If the document exists, the code is not unique
      codeExists = docSnapshot.exists();
    } while (codeExists); // Keep generating new codes until a unique one is found

    return code;
  };

  // Main function to generate or fetch a code
  const generateCode = async () => {
    setLoading(true);

    // Check if the family already has a non-expired code
    await getExistingCode();
    if (existingCode) {
      setMessage("이미 유효한 초대 코드가 존재합니다: " + existingCode);
      setLoading(false);
      return;
    }

    // Generate a unique invite code
    const code = await generateUniqueCode();

    // Set expiration date (e.g., 7 days from now)
    const expirationDate = Timestamp.fromDate(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );

    // Add the invite code to the inviteCodes collection and update the family document
    try {
      // Add a new document in InviteCodes with the code as the document ID
      await setDoc(doc(db, "inviteCodes", code), {
        familyId, // Associate this code with the family
        expirationDate, // Set the expiration date for the invite code
      });

      // Update the family document with the new invite code and expiration
      await updateDoc(doc(db, "families", familyId), {
        partnerCode: code,
        codeExpiration: expirationDate,
      });

      setGeneratedCode(code);
      setMessage("코드가 생성되었습니다! 이 코드를 공유하세요: " + code);
    } catch (error) {
      console.error("Error generating invite code: ", error);
      setMessage("코드 생성에 실패했습니다. 다시 시도해 주세요.");
    }

    setLoading(false);
  };

  const joinFamily = async () => {
    if (!inputCode) {
      setMessage("코드를 입력해주세요.");
      return;
    }
    if (!currentUser) {
      return;
    }

    try {
      // Check if the invite code exists and is not expired
      const inviteCodeRef = doc(db, "inviteCodes", inputCode);
      const inviteCodeSnapshot = await getDoc(inviteCodeRef);

      if (!inviteCodeSnapshot.exists()) {
        setMessage("유효하지 않은 코드입니다.");
        return;
      }

      const inviteData = inviteCodeSnapshot.data();
      const expiration = inviteData.expirationDate?.toDate();

      if (expiration && expiration <= new Date()) {
        setMessage("이 초대 코드는 만료되었습니다.");
        return;
      }

      // Get the partner family ID from the invite
      const partnerFamilyId = inviteData.familyId;

      // Fetch the partner family's document to check dadId and momId
      const partnerFamilyRef = doc(db, "families", partnerFamilyId);
      const partnerFamilySnapshot = await getDoc(partnerFamilyRef);

      if (!partnerFamilySnapshot.exists()) {
        setMessage("유효하지 않은 가족입니다.");
        return;
      }

      const partnerFamilyData = partnerFamilySnapshot.data();
      const dadId = partnerFamilyData.dadId;
      const momId = partnerFamilyData.momId;

      // Validate the user's parentType (assuming this comes from your user state)
      const userParentType = currentUser.parentType; // Replace this with actual user parent type (e.g., from state or context)
      const userId = currentUser.id!; // Replace this with actual userId (e.g., from auth or context)

      // Check if the parent type is already filled in the family
      if (userParentType === "dad" && dadId) {
        setMessage("이미 아빠가 등록되어 있습니다.");
        return;
      }

      if (userParentType === "mom" && momId) {
        setMessage("이미 엄마가 등록되어 있습니다.");
        return;
      }

      // Update the partner family with the user as the dad or mom
      const updatedFields =
        userParentType === "dad" ? { dadId: userId } : { momId: userId };

      await updateDoc(partnerFamilyRef, updatedFields);

      // Update the user's familyId to the new partnerFamilyId (the family they are joining)
      await updateDoc(doc(db, "users", userId), {
        familyId: partnerFamilyId,
      });

      setMessage("성공적으로 파트너로 추가되었습니다!");
    } catch (error) {
      console.error("Error joining family: ", error);
      setMessage("가족 추가에 실패했습니다.");
    }
  };

  // Fetch existing code on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await getExistingCode();
      setLoading(false);
    };

    fetchData();
  }, [familyId]);
  const copyToClipboard = () => {
    if (existingCode) {
      navigator.clipboard.writeText(existingCode);
      setCopySuccess(true); // Show notification when copied

      // Hide the notification after 2 seconds
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    }
  };

  const isExpired = codeExpiration && codeExpiration < new Date();
  console.log(isExpired);
  return (
    <div className={styles.container}>
      <h4>배우자 초대하기</h4>
      <p className={styles.announce}>
        초대 코드를 통해 배우자를 가족에 초대하세요. 또는 배우자로부터 받은
        코드를 입력하여 배우자 가족에 추가될수있습니다.
      </p>
      {/* Show existing code if it exists */}
      {existingCode && codeExpiration && !isExpired ? (
        <div className={styles.codes}>
          <p>
            초대 코드: <strong>{existingCode}</strong>
          </p>
          {/* Copy to clipboard button */}
          <button onClick={copyToClipboard} className="luckybug-btn">
            코드 복사하기
          </button>
          <div className={styles.spacer} />
          {/* Copy success notification */}
          {copySuccess && (
            <div>
              <div className={styles.copyNotification}>
                초대 코드가 복사되었습니다!
              </div>
              <div className={styles.spacer} />
            </div>
          )}
          <p className={styles.expiration}>
            (만료일: {codeExpiration.toLocaleString()}) <br />
            만료될 경우 새로 코드를 생성할 수 있습니다.
          </p>
        </div>
      ) : (
        <p>초대 코드를 생성할 수 있습니다.</p>
      )}

      {/* Generate code button - hidden if code exists */}
      {(!existingCode || isExpired) && (
        <button
          onClick={generateCode}
          disabled={!!existingCode || loading}
          className="luckybug-btn"
        >
          {loading ? "로딩 중..." : "코드 생성"}
        </button>
      )}

      {/* Display messages */}
      {message && <p>{message}</p>}

      {/* If a new code has been generated, show it */}
      {generatedCode && (
        <p>
          새로 생성된 코드: <strong>{generatedCode}</strong>
        </p>
      )}

      <h5>초대 코드 입력</h5>
      {/* Input field to enter partner code */}
      <input
        type="text"
        value={inputCode}
        onChange={(e) => setInputCode(e.target.value)}
        placeholder="초대 코드를 입력하세요"
      />
      <div className={styles.spacer} />
      <button onClick={joinFamily} className="luckybug-btn">
        가족 조인하기
      </button>
    </div>
  );
};

export default AddPartner;
