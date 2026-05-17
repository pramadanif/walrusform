module move_worm_v2::worm {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use sui::dynamic_field;
    use std::string::{String};
    use std::vector;

    /// A decentralized form pointer
    public struct Form has key, store {
        id: UID,
        title: String,
        form_blob_id: String,
        latest_submission_index_blob_id: String,
        creator: address,
        team_members: vector<address>, // ADDED: Native team support!
    }

    /// Struct to store in dynamic fields for status/note/rank
    public struct SubmissionMeta has store, drop {
        status: String,
        note: String,
        rank: u8,
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

    /// Event emitted when a team is registered
    public struct TeamCreated has copy, drop {
        form_id: address,
        team_id: address,
        members: vector<address>,
    }

    /// Event emitted when submission meta is updated
    public struct MetaUpdated has copy, drop {
        form_id: address,
        submission_blob_id: String,
        status: String,
        note: String,
        rank: u8,
    }

    // --- Seal SDK Compatibility ---

    /// A placeholder for the required Seal approval object.
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
            team_members: vector::singleton(sender), // Initialize with creator!
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
        form.latest_submission_index_blob_id = new_index_blob_id;

        event::emit(SubmissionIndexUpdated {
            form_id: object::uid_to_address(&form.id),
            new_index_blob_id,
        });
    }

    public entry fun seal_approve(
        form_id_addr: address,
        decryptors: vector<address>,
        ctx: &mut TxContext
    ) {
        let id = object::new(ctx);
        let approval_id_addr = object::uid_to_address(&id);
        let approval = SealApproval {
            id,
            form_id: form_id_addr,
            approved_decryptors: decryptors,
        };
        transfer::share_object(approval);

        event::emit(TeamCreated {
            form_id: form_id_addr,
            team_id: approval_id_addr,
            members: decryptors,
        });
    }

    /// ADDED: Add team member directly to Form object!
    /// Works without sealed forms too!
    public entry fun add_team_member(
        form: &mut Form,
        new_member: address,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        // Security check: Only creator or existing members can add
        assert!(
            sender == form.creator || vector::contains(&form.team_members, &sender),
            0
        );
        vector::push_back(&mut form.team_members, new_member);

        event::emit(TeamCreated {
            form_id: object::uid_to_address(&form.id),
            team_id: object::uid_to_address(&form.id),
            members: form.team_members,
        });
    }

    /// Fallback for backward compatibility or Seal specific flows
    public entry fun add_decryptor(
        form: &Form,
        approval: &mut SealApproval,
        new_decryptor: address,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(
            sender == form.creator || vector::contains(&approval.approved_decryptors, &sender),
            0
        );
        vector::push_back(&mut approval.approved_decryptors, new_decryptor);

        event::emit(TeamCreated {
            form_id: object::uid_to_address(&form.id),
            team_id: object::uid_to_address(&approval.id),
            members: approval.approved_decryptors,
        });
    }

    /// Update submission meta using Form's native team_members!
    public entry fun update_submission_meta(
        form: &mut Form,
        submission_blob_id: String,
        status: String,
        note: String,
        rank: u8,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        // Security check: Only creator or existing members can update meta
        assert!(
            sender == form.creator || vector::contains(&form.team_members, &sender),
            0
        );
        
        let meta = SubmissionMeta { status, note, rank };
        
        if (dynamic_field::exists_(&form.id, submission_blob_id)) {
            let existing_meta = dynamic_field::borrow_mut<String, SubmissionMeta>(&mut form.id, submission_blob_id);
            *existing_meta = meta;
        } else {
            dynamic_field::add(&mut form.id, submission_blob_id, meta);
        };

        event::emit(MetaUpdated {
            form_id: object::uid_to_address(&form.id),
            submission_blob_id,
            status,
            note,
            rank,
        });
    }
}
