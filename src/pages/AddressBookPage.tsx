import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import AddressFormModal from "../components/profile/AddressFormModal";
import { useAuth } from "../context/useAuth";
import { addressService } from "../services/addressService";
import { useToast } from "../context/useToast";
import type {
  CreateAddressPayload,
  SavedAddress,
  UpdateAddressPayload
} from "../types/address";
import { confirmDelete } from "../utils/deleteConfirmationUtils";

const AddressBookPage = () => {
  const { currentUser } = useAuth();

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingAddressId, setUpdatingAddressId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { showToast } = useToast();

  const loadAddresses = useCallback(async (): Promise<void> => {
    if (!currentUser) {
      setAddresses([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      const result = await addressService.getAddressesByUserId(currentUser.id);

      setAddresses(result);
    } catch {
      setErrorMessage(
        "Unable to load addresses. Please make sure JSON Server is running."
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  const defaultAddress = useMemo(() => {
    return addresses.find((address) => address.isDefault);
  }, [addresses]);

  const handleOpenAddModal = (): void => {
    setSelectedAddress(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (address: SavedAddress): void => {
    setSelectedAddress(address);
    setIsModalOpen(true);
  };

  const handleCloseModal = (): void => {
    setSelectedAddress(null);
    setIsModalOpen(false);
  };

  const handleSubmitAddress = async (
    values: Omit<CreateAddressPayload, "userId">
  ): Promise<void> => {
    if (!currentUser) {
      return;
    }

    try {
      if (values.isDefault) {
        await addressService.clearDefaultAddressForUser(
          currentUser.id,
          selectedAddress?.id
        );
      }

      if (selectedAddress) {
        const payload: UpdateAddressPayload = {
          ...values,
          updatedAt: new Date().toISOString()
        };

        const updatedAddress = await addressService.updateAddress(
          selectedAddress.id,
          payload
        );

        setAddresses((previousAddresses) =>
          previousAddresses
            .map((address) =>
              address.id === updatedAddress.id ? updatedAddress : address
            )
            .map((address) =>
              values.isDefault && address.id !== updatedAddress.id
                ? { ...address, isDefault: false }
                : address
            )
        );
      } else {
        const createdAddress = await addressService.createAddress({
          userId: currentUser.id,
          ...values
        });

        setAddresses((previousAddresses) => {
          const updatedAddresses = values.isDefault
            ? previousAddresses.map((address) => ({
                ...address,
                isDefault: false
              }))
            : previousAddresses;

          return [createdAddress, ...updatedAddresses];
        });
      }

      handleCloseModal();
    } catch {
      setErrorMessage("Failed to process address updates. Please try again.");
    } finally {
      void loadAddresses();
    }
  };

  const handleSetDefault = async (address: SavedAddress): Promise<void> => {
    if (!currentUser) {
      return;
    }

    try {
      setUpdatingAddressId(address.id);

      const updatedAddress = await addressService.setDefaultAddress(
        currentUser.id,
        address.id
      );

      setAddresses((previousAddresses) =>
        previousAddresses.map((existingAddress) => ({
          ...existingAddress,
          isDefault: existingAddress.id === updatedAddress.id
        }))
      );
    } catch {
      setErrorMessage("Unable to set default address.");
    } finally {
      setUpdatingAddressId("");
    }
  };

  const handleDeleteAddress = async (addressId: string): Promise<void> => {
  // 1. Added await here if confirmDelete returns a Promise for modal interaction
  const confirmed = await confirmDelete({
    entityLabel: "Address",
    entityId: addressId
  });

  if (!confirmed) {
    return;
  }

  try {
    await addressService.deleteAddress(addressId);

    // 2. Clear state optimistically 
    setAddresses((previousAddresses) =>
      previousAddresses.filter((address) => address.id !== addressId)
    );

    // 3. Cleaned up the description text to be user-friendly
    showToast(
      "Address deleted",
      "The address has been removed from your profile successfully.",
      "success"
    );
  } catch {
    showToast(
      "Unable to delete address", 
      "Please check your connection and try again.", 
      "danger"
    );
  }
};
  if (isLoading) {
    return (
      <main className="account-page bg-light">
        <div className="container-fluid py-5">
          <Loader message="Loading address book..." />
        </div>
      </main>
    );
  }

  return (
    <main className="account-page bg-light">
      <section className="container-fluid py-4">
        <div className="row g-4">
          <aside className="col-lg-3">
            <div className="account-sidebar bg-white overflow-hidden">
              <div className="account-sidebar-title p-4 border-bottom">
                <h5 className="fw-bold mb-1">Account</h5>
                <p className="text-muted small mb-0">
                  Manage your profile and activity.
                </p>
              </div>

              <div className="list-group list-group-flush account-nav-list">
                <Link
                  to="/profile"
                  className="list-group-item list-group-item-action"
                >
                  <i className="bi bi-person me-2" />
                  Profile Overview
                </Link>

                <Link
                  to="/orders"
                  className="list-group-item list-group-item-action"
                >
                  <i className="bi bi-box-seam me-2" />
                  Orders & Returns
                </Link>

                <Link
                  to="/addresses"
                  className="list-group-item list-group-item-action active"
                >
                  <i className="bi bi-geo-alt-fill me-2" />
                  Addresses
                </Link>

                <Link
                  to="/wallet"
                  className="list-group-item list-group-item-action"
                >
                  <i className="bi bi-wallet2 me-2" />
                  Wallet
                </Link>
              </div>
            </div>
          </aside>

          <section className="col-lg-9">
            <div className="account-section-card bg-white">
              <div className="account-section-header p-4 border-bottom">
                <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                  <div>
                    <h1 className="h4 fw-bold mb-1">Saved Addresses</h1>
                    <p className="text-muted mb-0">
                      Manage delivery addresses for faster checkout.
                    </p>
                  </div>

                  <Button variant="Info" className="btn btn-light account-header-action-btn" onClick={handleOpenAddModal}>
                    <i className="bi bi-plus-lg me-2" />
                    Add New Address
                  </Button>
                </div>
              </div>

              <div className="p-4">
                {errorMessage ? (
                  <div className="alert alert-danger" role="alert">
                    {errorMessage}
                  </div>
                ) : null}

                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <div className="account-info-tile">
                      <span>Total Addresses</span>
                      <strong>{addresses.length}</strong>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="account-info-tile">
                      <span>Default Address</span>
                      <strong>
                        {defaultAddress ? defaultAddress.fullName : "Not set"}
                      </strong>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="account-info-tile">
                      <span>Checkout Ready</span>
                      <strong>{defaultAddress ? "Yes" : "No"}</strong>
                    </div>
                  </div>
                </div>

                {addresses.length === 0 ? (
                  <EmptyState
                    title="No Addresses Saved"
                    message="You don't have any shipping addresses saved yet. Add one to get started with a faster checkout experience."
                    iconClassName="bi bi-geo-alt-fill text-danger"
                    action={
                      <Button variant="dark" onClick={handleOpenAddModal}>
                        <i className="bi bi-plus-lg me-2" />
                        Add Address
                      </Button>
                    }
                  />
                ) : (
                  <div className="row g-4">
                    {addresses.map((address) => (
                      <div className="col-md-6" key={address.id}>
                        <div className="address-card-v2 bg-white border h-100">
                          <div className="address-card-header p-4 border-bottom">
                            <div className="d-flex justify-content-between gap-3">
                              <div>
                                <span className="neutral-badge">
                                  {address.addressType}
                                </span>

                                {address.isDefault ? (
                                  <span className="neutral-badge-dark ms-2">
                                    Default
                                  </span>
                                ) : null}
                              </div>

                              <i className="bi bi-geo-alt-fill text-danger fs-5" />
                            </div>
                          </div>

                          <div className="p-4">
                            <h5 className="fw-bold mb-2">
                              {address.fullName}
                            </h5>

                            <p className="text-muted mb-2">
                              <i className="bi bi-telephone me-2" />
                              {address.mobile}
                            </p>

                            <p className="text-muted mb-4">
                              {address.addressLine}, {address.city},{" "}
                              {address.state} - {address.pincode}
                            </p>

                            <div className="d-flex flex-wrap gap-2">
                              {!address.isDefault ? (
                                <Button
                                  variant="outline-dark"
                                  className="btn-sm"
                                  isLoading={updatingAddressId === address.id}
                                  onClick={() => void handleSetDefault(address)}
                                >
                                  Set Default
                                </Button>
                              ) : null}

                              <Button
                                variant="outline-secondary"
                                className="btn-sm"
                                onClick={() => handleOpenEditModal(address)}
                              >
                                Edit
                              </Button>

                              <Button
                                variant="outline-danger"
                                className="btn-sm"
                                isLoading={updatingAddressId === address.id}
                                onClick={() =>
                                  void handleDeleteAddress(address.id)
                                }
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </section>

      {isModalOpen ? (
        <AddressFormModal
          address={selectedAddress}
          onClose={handleCloseModal}
          onSubmit={handleSubmitAddress}
        />
      ) : null}
    </main>
  );
};

export default AddressBookPage;