module move_worm_v2::worm {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use std::string::{String};

    /// A decentralized form pointer
    public struct Form has key, store {
        id: UID,
        title: String,
        form_blob_id: String,
        latest_submission_index_blob_id: String,
        creator: address,
    }

    /// Event emitted when a form is registered
    public struct FormCreated has copy, drop {
        form_id: address,
        creator: address,
        form_blob_id: String,
    }

    /// Event emitted when a submission index is updated
    public struct SubmissionIndexUpdated has copy, drop {
        form_id: address,
        new_index_blob_id: String,
    }

    // --- Seal SDK Compatibility ---

    /// A placeholder for the required Seal approval object.
    /// In a production scenario, this would interact with the Mysten Seal system.
    public struct SealApproval has key, store {
        id: UID,
        form_id: address,
        approved_decryptors: vector<address>,
    }

    public entry fun create_form(
        title: String,
        form_blob_id: String,
        submission_index_blob_id: String,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let id = object::new(ctx);
        let form_id_addr = object::uid_to_address(&id);
        
        let form = Form {
            id,
            title,
            form_blob_id,
            latest_submission_index_blob_id: submission_index_blob_id,
            creator: sender,
        };

        transfer::share_object(form);

        event::emit(FormCreated {
            form_id: form_id_addr,
            creator: sender,
            form_blob_id,
        });
    }

    public entry fun update_submission_index(
        form: &mut Form,
        new_index_blob_id: String,
        _ctx: &mut TxContext
    ) {
        // Anyone can update the index for now (Discovery Tier)
        form.latest_submission_index_blob_id = new_index_blob_id;

        event::emit(SubmissionIndexUpdated {
            form_id: object::uid_to_address(&form.id),
            new_index_blob_id,
        });
    }

    /// Required by @mysten/seal SDK flow
    public entry fun seal_approve(
        form_id_addr: address,
        decryptors: vector<address>,
        ctx: &mut TxContext
    ) {
        let id = object::new(ctx);
        let approval = SealApproval {
            id,
            form_id: form_id_addr,
            approved_decryptors: decryptors,
        };
        // In real Seal, we would transfer to the Seal system or share
        transfer::share_object(approval);
    }
}
