import React, { useEffect, useState } from "react";
import "./AdminUsers.css";
import Header from "../Header";
import Modal from "../Modal";
import Unauthorized from "../../pages/Unauthorized"; 

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState(null); // Düzenlenen kullanıcı ID'si
  const [modal, setModal] = useState({ isOpen: false, type: "", message: "" }); // Modal durumu
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:5000/admin/users", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.status === 403 || response.status === 401) {
          setUnauthorized(true);
          return;
        }

        if (!response.ok) {
          throw new Error(`Kullanıcılar alınamadı: ${response.status}`);
        }

        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await fetch(`http://localhost:5000/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error(`Rol güncellenemedi: ${response.status}`);
      }

      const updatedUser = await response.json();
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === updatedUser.id ? updatedUser : user))
      );
      setModal({ isOpen: true, type: "success", message: "Rol başarıyla güncellendi!" });
    } catch (err) {
      setModal({ isOpen: true, type: "error", message: err.message });
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Kullanıcı silinemedi: ${response.status}`);
      }

      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
      setModal({ isOpen: true, type: "success", message: "Kullanıcı başarıyla silindi!" });
    } catch (err) {
      setModal({ isOpen: true, type: "error", message: err.message });
    }
  };

  const handleEditUser = (userId) => {
    setEditingUserId(userId); // Düzenleme moduna geç
  };

  const handleSaveUser = async (userId) => {
    const userToSave = users.find((user) => user.id === userId);

    try {
      const response = await fetch(`http://localhost:5000/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(userToSave),
      });

      if (!response.ok) {
        throw new Error(`Kullanıcı güncellenemedi: ${response.status}`);
      }

      const savedUser = await response.json();
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === savedUser.id ? savedUser : user))
      );
      setEditingUserId(null); // Düzenleme modundan çık
      setModal({ isOpen: true, type: "success", message: "Kullanıcı başarıyla güncellendi!" });
    } catch (err) {
      setModal({ isOpen: true, type: "error", message: err.message });
    }
  };

  const handleInputChange = (userId, field, value) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, [field]: value } : user
      )
    );
  };

  if (unauthorized) {
    return <Unauthorized />;
  }

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }



  return (
    <>
      <Header />
      <div className="admin-users">
        <h2>Kullanıcı Yönetimi</h2>
        {error && <p className="error-message">{error}</p>}
        <div className="admin-users-table-wrapper">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Ad</th>
                <th>Soyad</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Telefon</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td data-label="ID">{user.id}</td>
                  <td data-label="Ad">
                    {editingUserId === user.id ? (
                      <input
                        type="text"
                        value={user.first_name}
                        onChange={(e) =>
                          handleInputChange(user.id, "first_name", e.target.value)
                        }
                      />
                    ) : (
                      user.first_name
                    )}
                  </td>
                  <td data-label="Soyad">
                    {editingUserId === user.id ? (
                      <input
                        type="text"
                        value={user.last_name}
                        onChange={(e) =>
                          handleInputChange(user.id, "last_name", e.target.value)
                        }
                      />
                    ) : (
                      user.last_name
                    )}
                  </td>
                  <td data-label="Email">{user.email}</td>
                  <td data-label="Rol">
                    {editingUserId === user.id ? (
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleInputChange(user.id, "role", e.target.value)
                        }
                      >
                        <option value="user">Kullanıcı</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      user.role
                    )}
                  </td>
                  <td data-label="Telefon">
                    {editingUserId === user.id ? (
                      <input
                        type="text"
                        value={user.phone_number}
                        onChange={(e) =>
                          handleInputChange(user.id, "phone_number", e.target.value)
                        }
                      />
                    ) : (
                      user.phone_number
                    )}
                  </td>
                  <td data-label="İşlemler">
                    {editingUserId === user.id ? (
                      <button
                        className="save-button"
                        onClick={() => handleSaveUser(user.id)}
                      >
                        Kaydet
                      </button>
                    ) : (
                      <button
                        className="edit-button"
                        onClick={() => handleEditUser(user.id)}
                      >
                        Düzenle
                      </button>
                    )}
                    {/* <button
                      className="delete-button"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Sil
                    </button> */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Modal */}
        {modal.isOpen && (
          <Modal
            isOpen={modal.isOpen}
            onClose={() => setModal({ isOpen: false, type: "", message: "" })}
            title={modal.type === "success" ? "Başarılı" : "Hata"}
            message={modal.message}
            type={modal.type}
          />
        )}
      </div>
    </>
  );
};

export default AdminUsers;